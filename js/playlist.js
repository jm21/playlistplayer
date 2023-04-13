(function ( $ ) {
    $.playList = function(container) {

        //default settings
        var defaults = {
            playlistTimer: 30000, 
            template: 'fullPage',
            templateHTML: '',
        }

        //player elements
        var $container = $(container),
            plugin = this,
            $playList = '';

        //state management
        var state = {}

        plugin.init = function(){
          
            $.getJSON( "playlist.json?nocache=" + (new Date()).getTime(), function(obj) {
                if(obj.md5 != $container.find('#md5check').val()) { 
                    $playList = obj; 
                    $container.find('#md5check').val(obj.md5);

                    plugin.getPlaylist(); //get current playlist              
                    plugin.selectTemplate(); //get template
                    plugin.checkPlayListState(); //check if md5 has changed
                }
              
            });
        };


        plugin.getTime = function(){
            const url = "https://www.timeapi.io/api/Time/current/zone?timeZone=Africa/Johannesburg";
            const options = { mode: "no-cors" };

            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Accept', 'application/json');
            headers.append('Origin','http://kfc-webos.test:90/');

              fetch(url, { mode: "cors"})
                .then(response => console.log(response))
          // .then(json => console.log(json))
                .catch(function(error) {
                    console.log('Looks like there was a problem: ', error);
                });

            
        }

        /**
         * Get the playlist that should be played based on the time
         */
        plugin.getPlaylist = function () { 
            state['currentPlaylist'] = $playList.playlist[0]; //default
            state['currentPlaylistIndex'] = 0; 

            $playList.playlist.forEach(function ( value, key) { 
              
                let currentTime = new Date(); 
                if(!value.days.includes(currentTime.getDay())){
                    return false;
                }

                let playlistStart = value.start.split(':'); // assumed format "00:00:00"
                let playlistStop = value.stop.split(':');  // assumed format "00:00:00"
                let after = value.after.split(' '); // assumed format "2021-12-07 00:00:00"

                 //if its after start date
                if(currentTime.getTime() > new Date(after[0]+'T'+after[1]).getTime() ){    
                    if(currentTime.getHours() >= playlistStart[0] && currentTime.getHours() <= playlistStop[0] ){   //if current hour between playlist starthour and playlist stop hour 
                       if(currentTime.getMinutes() >= playlistStart[1] && currentTime.getMinutes() <= playlistStop[1]){    
                            state['currentPlaylist'] = value;   
                            state['currentPlaylistIndex'] = key;console.log(state.currentPlaylist)
                            return false;
                       }
                    }
                }
               
            })
        }

        /**
         * Check to see if new playlist is available after set time defined in defaults.playlistTimer
         */

        plugin.checkPlayListState  = function(){
           
            setInterval(function(){    
                $.getJSON( "playlist.json?nocache=" + (new Date()).getTime(), function(obj) { 
                    if(plugin.reloadMedia(obj)) {
                        location.reload()
                    }
                });
            }, defaults.playlistTimer);
           
        }

        /**
         * cheecks to see if md5 has changed on remote playlist so that new playlist is reloaded
         * Also checks to see if the right playlist is being played depending on time
         * @param {*} obj 
         * @returns boolean
         */
        plugin.reloadMedia = function(obj){
        
            if(obj.md5 != $container.find('#md5check').val()) {
              return true
            }

            var stop = state.currentPlaylist.stop;
            var now = new Date();  
            if(stop.split(":")[0] > now.getHours()) {
                return false
            } 

            if(stop.split(":")[0] == now.getHours() && stop.split(":")[1] > now.getMinutes()) {
                return false
            } 

            if(stop.split(":")[0] == now.getHours() && stop.split(":")[1] <= now.getMinutes()) {
                return true
            } 

            return false;
        }

        plugin.selectTemplate = function(){ 
            $.get('./templates/' + state.currentPlaylist.template + '.html', "", function(data){  
                if(data == 'undefined') {
                    $.get('./templates/' + defaults.template + '.html', "", function(data){
                        plugin.setUpHTML(data);  
                    });
                } else {
                    plugin.setUpHTML(data);
                }                   
            });
           
        }

        plugin.setUpHTML = function(template){ 
            if(!template || template == 'undefined') {
                alert('Undefined template')
            }
            defaults.templateHTML = template;
            var templateHtml = $.parseHTML( template );
            var playListContainer = $('#playListdiv');
            playListContainer.append( templateHtml );
            var zonesCount =  $('#playListdiv').find('#zonesCount').val();

            for (let index = 0; index < zonesCount; index++) { 
                playListContainer.find("#zone"+ parseInt(index +1) +"").append("<video  class='mediaplayer' id='videoPlayer"+ parseInt(index +1) +"' muted='true' loop='false'><source id='videoSrc"+ parseInt(index +1) +"'></video><div class='main__image-container'><picture><img  id='imagePlayer"+ parseInt(index +1) +"' ></picture></div>")   
            }


           plugin.playInit();
        }

  
        plugin.setState = function(zone) {
            var stateID = 'zone'+ zone.zone;
            state[stateID].remainingMedia = state[stateID].playListCount - state[stateID].currentMedia; 
            if( state[stateID].remainingMedia == 0 ){
                state[stateID].currentMedia = 0;
                state[stateID].remainingMedia = 0;
            } 
        }

        plugin.playInit = function(){
            for (let index = 0; index < state.currentPlaylist.sections ; index++) {
                $stateID = 'zone'+ parseInt(index +1 );
                plugin.cacheImages(state.currentPlaylist.zones[index].media);
                state[$stateID] = {
                    currentMedia : 0,
                    remainingMedia : 0,
                    playListCount : 0,
                }
                plugin.play(state.currentPlaylist.zones[index]);
                
            }
        }

        plugin.cacheImages = function(media){
           
            if (!preloadImages) {
               var preloadImages = {};
                preloadImages.list = [];
            }
            var list = preloadImages.list;
            $(media).each(function(k, value){
                if(value.type == 'image') {
                    var img = new Image();
                    img.onload = function() {
                        var index = list.indexOf(this);
                        if (index !== -1) {
                            // remove image from the array once it's loaded
                            // for memory consumption reasons
                            list.splice(index, 1);
                        }
                    }
                    list.push(img);
                    img.src = value['src'];
                }
            });
           
        }

        plugin.play = function(zone) {   
            var stateID = 'zone'+ zone.zone;
            state[stateID].playListCount = zone.media.length; 
            var targetContainer = $container.find('#zone' +  zone.zone); 
            targetContainer.css('background-color', zone.defaultBackground.color);
            if(zone.defaultBackground.image !== 'none'){
                targetContainer.css('background-image', zone.defaultBackground.image);
            }
            targetContainer.find('.mediaplayer').hide();  

           
            var stateID = 'zone'+ zone.zone; 
            if(zone.media.length > 0 ) {
                var mediaType = zone.media[state[stateID].currentMedia].type; 

                switch (mediaType) {
                    case 'video':
                        plugin.playVideo(zone);
                        break;
                    
                    case 'image':
                        plugin.playImage(zone);
                        break;
    
                   case 'html':
                        plugin.playHTML(zone);
                        break;
                    default:
                        break;
                }
            } 
           
        }

       

        plugin.playVideo = function(zone) {  
            var stateID = 'zone'+ zone.zone;
            var media = zone.media[state[stateID].currentMedia];
            var source = document.getElementById("videoSrc"+zone.zone+"")  ; 
            var $videoPlayer = document.getElementById("videoPlayer"+zone.zone+"")  ;
            source.removeAttribute('src');   
            source.setAttribute('src', state.currentPlaylist.defaultVideo.src);  
            
            //if(!plugin.fileExists(media.src)){ 
                source.setAttribute('src', media.src);     
           // }   
      
            $videoPlayer.load();   
            $videoPlayer.loop = false;
                 
            $videoPlayer.append(source); 
            $videoPlayer.muted = true;
          
            $($videoPlayer).show()
            $videoPlayer.play();
            state[stateID].currentMedia++;

            plugin.setState(zone);

            if(state[stateID]['playListCount'] == 1){
                $videoPlayer.loop = true;
            } else {
                $videoPlayer.onended = function(e) {     
                    $($videoPlayer).hide()
                    plugin.play(zone);
                }     
            }   
        };

        plugin.playImage = function(zone) { 
            var stateID = 'zone'+ zone.zone;
            var media = zone.media[state[stateID].currentMedia]; 
            var $imagePlayer = $("#imagePlayer"+zone.zone+"")  ;
            if(!plugin.fileExists(media.src)){ 
               media = state.currentPlaylist.defaultImage;
            }   
            $imagePlayer.attr('srcset', media.src);
            $($imagePlayer).show();
            state[stateID].currentMedia++;
           
            plugin.setState(zone);
            setTimeout(function(){   
                $($imagePlayer).hide()
                plugin.play(zone)
            }, media.length);
        };

         plugin.fileExists = function(url) {
            if(url){
                var req = new XMLHttpRequest();
                req.open('GET', url, false);
                req.send();
                return req.status==200;
            } else {
                return false;
            }
        };

        plugin.init();
    };

    $.fn.playList = function() {
        var args = arguments;
    
        return this.each(function() {
          var $this = $(this),
              plugin = $this.data('playList');
    
          if (undefined === plugin) {
            plugin = new $.playList(this);
          }
    
        });
      };
}( jQuery ));