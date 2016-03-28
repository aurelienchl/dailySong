$(function(){

	checkConnection();
	checkUUID();
	resizePaddingCircles();
	resizePlayPadding();
	initStats();

	setTimeout(function(){
		switchPage('main_page');
	}, 4000);

	$("#commentsModal").animatedModal({'color' : '#442D2C', 'overflow' : 'scroll'});

	$('#start_button').click(function(){
		width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
		height = parseInt(width) * 0.95;

		$(this).closest('.row').addClass('hidden').fadeOut();
		initLoader();

		$.ajax({
			url : getAPIPath() + '/get_song_link.php',
		}).done(function(res){
			song = JSON.parse(res);
			$('#song_id').attr('value', song['id']);
			$('#daySong').attr('width', width).attr('height', height);
			$('#daySong').attr('src', song['link']);
			$('span#likes_nb').html(song['likes']);	
			$('span#dislikes_nb').html(song['dislikes']);
			loadTodayComments();
			$this = $(this);	
			setTimeout( function() {
				$this.css('color', '#4272C7');
				closeLoader();
				$('#daySong').closest('.row').removeClass('hidden').fadeIn();
				checkUUID();	
			}, 5000);
		}).fail(function(){
			console.warn('An error occured during the ajax request');
		});
	});

	$('#history_button').click(function(){
		if(checkUUID() !== false){
			if( $('#song_history .line_song_history').length == 0 ) {
				setTimeout(function(){
					uuid = $('input#uuid').attr('value');
					$.ajax({
						url : getAPIPath() + '/get_vote_history.php',
						data : {uuid:uuid}
					}).done(function(res){
						ret = JSON.parse(res);
						if(typeof ret['error'] != 'undefined') notify('warning', ret['error'] );
						else {
							for(i in ret){
								song_name = ret[i]['artist'] + ' - ' + ret[i]['title'];
								like_class = (ret[i]['liked'] == 1) ? 'up' : 'down';
								line_class = (ret[i]['liked'] == 1) ? 'liked' : 'disliked';
								vote_date = ret[i]['created'];
								history_model = $('#song_history .model_song_history').clone();
								history_model.find('.song_name').html(song_name);
								history_model.find('.vote_date').html(vote_date);
								history_model.find('.vote_like .glyphicon').addClass('glyphicon-thumbs-' + like_class);
								history_model.addClass('line_song_history ' + line_class).removeClass('model_song_history hidden');
								$('#song_history').append(history_model);
							}
						}
						switchPage('song_history');
					}).fail(function(){
						console.warn('An error occured during the ajax request');
					});
				}, 300);				
			} else {
				switchPage('song_history');
			}
		}
	});

	$('#home_button').click(function(){
		$('#primary').css('background-color', '#7EA6E0');
		switchPage('main_page');
	});

	$('.like a').click(function(){
		value = $(this).data('value');
		song_id = $('#song_id').val();
		uuid = $(this).data('uuid');
		$this = $(this);

		$.ajax({
			url : getAPIPath() + '/add_review.php',
			data : {song_id:song_id, like:value, uuid:uuid}
		}).done(function(res){
			ret = JSON.parse(res);
			id = ( value == 1 ) ? 'likes' : 'dislikes';
			review_nb = parseInt( $('span#' + id + '_nb').html() );
			if(typeof ret['error'] != 'undefined') notify('warning', ret['error']);
			else if(typeof ret['success'] != 'undefined'){
				notify('success', ret['success']);
				color = ( value == 1 ) ? '#17D42F' : '#D41717';
				$this.find('.glyphicon').css('color', color);	
				$('span#' + id + '_nb').html( review_nb + 1 );			
			} 
		}).fail(function(){
			console.warn('An error occured during the ajax request');
		});

	});

	$('#submit_comment').click(function(){
		song_id = $('#song_id').val();
		comment = $('.add_comment textarea').val();
		uuid = $('#uuid').val();
		if( song_id == "" || comment == "" || uuid == "" ){
			notify('warning', 'We are not able to validate your comment');
		} else {
			$.ajax({
				url : getAPIPath() + '/add_comment.php',
				data : {song_id:song_id, comment:JSON.stringify(comment), uuid:uuid}
			}).done(function(res){
				if (res == 1) {
					loadTodayComments(true);
					notify('success', 'Your comment has been added');
				} else {
					notify('error', 'An error occured : ' + res);
				}
			}).fail(function(){
				console.warn('An error occured during the ajax request');
			});			
		}
	});
});

function switchPage(pageID){
	$('#primary .page').each(function(){
		if( $(this).hasClass('hidden') == false ) $(this).addClass('hidden fadeOutLeft').fadeOut();
	});
	$('#' + pageID).removeClass('hidden').addClass('fadeInRight');
	setTimeout( function(){clearAnimations()}, 500);
	$('#bottom_navbar button').each(function(){
		if( $(this).hasClass('selected') ) $(this).removeClass('selected');
	});
	if( $('#loader').hasClass('hidden') === false )
		$('#loader').addClass('hidden');
	if( $('#loader-home').hasClass('hidden') === false )
		$('#loader-home').addClass('hidden');	
	$('[data-target="' + pageID + '"]').addClass('selected');
}

function clearAnimations(){
	animation_classes = ['fadeOutLeft', 'fadeInRight'];
	$('#primary .page').each(function(){
		for(i in animation_classes){
			if( $(this).hasClass(animation_classes[i]) ) $(this).removeClass(animation_classes[i]);
		}
	});
}

function getAPIPath(){
	return 'http://www.aurelienchampeval.com/api';
}

function checkConnection(){
	setInterval(function(){
		if(!hostReachable( getAPIPath() + '/get_song_link.php' )) notify('danger', 'Not able to reach the server');
	}, 30000);
}

function checkUUID(){
	if(typeof window.plugins != 'undefined' && typeof window.plugins.uniqueDeviceID != 'undefined') window.plugins.uniqueDeviceID.get(successUUID, failUUID);
	else if(typeof window.device != 'undefined') successUUID(window.device.uuid);
	else successUUID('test141191');	
	// else failUUID();	
}

function notify(type, msg){
	msg_type = "";
	switch (type) {
	    case 'info':
	        msg_type = "Info !";
	        break;
	    case 'warning':
	        msg_type = "Warning !";
	        break;
	    case 'success':
	        msg_type = "Success !";
	        break;
	    case 'danger':
	        msg_type = "Danger !";
	        break;
	}
	$('#alert_model .msg-type').html(msg_type);
	$('#alert_model .msg-alert').html(msg);
	$('#alert_model').addClass('alert-'+type);
	$('#alert_model').removeClass('hidden').fadeIn();
	setTimeout( function() {
		$('#alert_model').addClass('hidden').fadeOut();
	}, 6000);
}

function successUUID(uuid){
	$('.like a').each(function(){
		$(this).data('uuid', uuid);
	});
	$('input#uuid').attr('value', uuid);
	$('#debug_div').prepend('<p>UUID : ' + uuid + '</p>');
	return uuid;
}

function failUUID(){
	notify('warning', 'We cannot identify your mobile device so some fonctionnalities have been disabled');
	$('#primary .row.like').addClass('hidden');
	return false;
}

function setLocalVar(key, value){
	return window.localStorage.setItem(key, value);
}

function getLocalVar(key){
	return window.localStorage.getItem(key);
}

function initLoader(){
	$('#primary').css('background-color', '#FFF');
	$('#loader').removeClass('hidden').fadeIn();
}

function closeLoader(){
	$('#primary').css('background-color', 'black');
	$('#loader').addClass('hidden').fadeOut();
}

function hostReachable(url) {

  // Handle IE and more capable browsers
  var xhr = new ( window.ActiveXObject || XMLHttpRequest )( "Microsoft.XMLHTTP" );
  var status;

  // Open new request as a HEAD to the root hostname with a random param to bust the cache
  xhr.open( "HEAD", url + "?rand=" + Math.floor((1 + Math.random()) * 0x10000), false );

  // Issue request and handle response
  try {
    xhr.send();
    return ( xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304) );
  } catch (error) {
    return false;
  }

}

function resizePaddingCircles(){
	height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
	// padRatio = 11.34;
	padRatio = 12;
	padding = height / padRatio;
	$("#main_page .stats").css('padding-top', padding + 'px');
	$("#main_page .stats").css('padding-bottom', padding + 'px');
}

function loadTodayComments(reload){
	if( $('.comment').not('.comment_model').length > 0 && reload )
		$('.comment').not('.comment_model').remove();

	if( $('.comment').not('.comment_model').length == 0 ){
		$.ajax({
			url : getAPIPath() + '/list_comments.php'
		}).done(function(res){
			res = JSON.parse(res);
			for(i in res){
				comment_model = $('#daily_song_page .comment_model').clone();
				comment_model.removeClass('hidden comment_model');
				comment_model.find('p').html(res[i]['comment']);
				$('#daily_song_page .comments').append(comment_model);				
			}
		}).fail(function(){
			console.warn('An error occured during the ajax request');
		});			
	}

}

function initStats(){
	$.ajax({
		url : getAPIPath() + '/get_stats.php'
	}).done(function(res){
		res = JSON.parse(res);
		$('#songs_cpt').html(res['songs']);
		$('#votes_cpt').html(res['votes']);
		$('#users_cpt').html(res['uuid']);
	}).fail(function(){
		console.warn('An error occured during the ajax request');
	});			
}

function resizePlayPadding(){
	height = screen.height;
	padRatio = 8.4;
	$('#play_icon').css('padding', (height/padRatio) + 'px 0px');
}
