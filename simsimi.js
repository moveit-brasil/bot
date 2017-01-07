/**
    Bots API by Caipira
     
    Script para ser executado no plug, dubtrack e musiqpad sem seleÃ§Ã£o manual do site.
    Nota: esta API apenas comunica diretamente com os sites responsÃ¡veis pelos conteÃºdos providos,
    nÃ£o tendo direitos sobre seus conteÃºdos nem receita envolvida nesse meio.
*/
 
(function() {
    var bots = {
        consts: {
            PLUG: 1,
            DUB: 2,
            MP: 3
        },
        session: {
            site: 0
        },
        util: {
            detectSite: function() {
                if (document.location.origin.match(/dubtrack\.fm$/))
                    return bots.consts.DUB;
                 
                if (document.location.origin.match(/plug\.dj$/))
                    return bots.consts.PLUG;
                 
                /* O musiqpad pode ser hosteado em qualquer domÃ­nio, portanto
                    tentaremos identificÃ¡-lo a partir de caracterÃ­sticas prÃ³prias,
                    como a API e coisas da pÃ¡gina. */
                 
                if (window.API && API.DATA && API.room && API.chat)
                    return bots.consts.MP;
                 
                return -1;
            },
            parseChatObj: function(obj){
                switch(bots.session.site) {
                    case bots.consts.PLUG:
                        return {
                            un: obj.un,
                            msg: obj.message,
                            staff: API.getUser(obj.uid).role > 2
                        };
                     
                    case bots.consts.DUB:
                        return {
                            un: obj.user.username,
                            msg: obj.message,
                            staff: API.getUser(obj.user._id).role > 3
                        };
                     
                    case bots.consts.MP:
                        var user = API.room.getUser(obj.uid);
                        return {
                            un: user.un,
                            msg: obj.message,
                            staff: typeof API.room.getStaffRoles == 'function' && API.room.getStaffRoles().indexOf(user.role) != -1
                        };
                     
                    default:
                        return null;
                }
            },
            sendChat: function(msg) {
                var sendFunction = API.sendChat || API.chat.send;
                 
                if (!sendFunction) return;
                 
                sendFunction(msg);
            },
            loadDubCustomAPI: function() {
                (function(){if(window.API)return;window.API={};_.extend(API,Backbone.Events);var waitlist=[],lastMedia={song:null,songInfo:null,user:null,startTime:0};API.events={USER_JOIN:'user-join',USER_LEAVE:'user-leave',USER_SET_ROLE:'user-setrole',USER_UNSET_ROLE:'user-unsetrole',USER_BAN:'user-ban',USER_KICK:'user-kick',USER_MUTE:'user-mute',USER_UNBAN:'user-unban',USER_UNMUTE:'user-unmute',USER_UPDATE:'user-update',CHAT_MESSAGE:'chat-message',CHAT_SKIP:'chat-skip',DELETE_CHAT_MESSAGE:'delete-chat-message',ROOM_UPDATE:'room-update',ROOM_PLAYLIST_UPDATE:'room_playlist-update',ROOM_PLAYLIST_QUEUE_REORDER:'room_playlist-queue-reorder',ROOM_PLAYLIST_QUEUE_UPDATE_DUB:'room_playlist-queue-update-dub',ROOM_PLAYLIST_DUB:'room_playlist-dub'};API.consts={COHOST:'5615fa9ae596154a5c000000',MANAGER:'5615fd84e596150061000003',MOD:'52d1ce33c38a06510c000001',VIP:'5615fe1ee596154fc2000001',RESDJ:'5615feb8e596154fc2000002',DJ:'564435423f6ba174d2000001',NONE:undefined};API.chat={groupMessages:true};API.getTimeRemaining=function(){var remaining=0,yt=Dubtrack.room.player.YTplayerDelegate,sc=Dubtrack.room.player.SCplayerDelegate;if(sc&&sc.scPlayer){remaining=~~((sc.scPlayer.duration-sc.scPlayer.position)/1e3)}else if(yt&&yt.player){remaining=~~(yt.player.getDuration()-yt.player.getCurrentTime())}return remaining};API.getWaitListPosition=function(userid){if(!waitlist||waitlist.length==0)return-1;if(!userid||typeof userid!='string')userid=API.getUser().userid;var pos=0;for(var song of waitlist){if(song.userid==userid){return pos}pos++}return-1};API.getWaitList=function(){return waitlist};API.getRoom=function(){return Dubtrack.room.model.toJSON()};API.getDJ=function(){var media=this.getMedia();if(!media||!media.user)return null;return this.getUser(media.user.toJSON()._id)};API.getSelf=function(){return Dubtrack.session.toJSON()};API.getUser=function(id){if(!id)id=this.getSelf()._id;return this.getUsers().filter(function(a){return a.userid==id})[0]};API.getHost=function(){return this.getUser(Dubtrack.room.model.toJSON().userid)};API.getUserByName=function(username){return this.getUsers().filter(function(a){return a.username==username})[0]};API.getUsers=function(){var list=[],users1=Dubtrack.room.users.collection.toJSON(),users2=Dubtrack.cache.users.collection.toJSON();for(var user of users1){var aux=users2.filter(function(a){return a._id==user.userid})[0];if(aux){var uaux=Object.keys(aux);for(var k of uaux){if(!user.hasOwnProperty(k))user[k]=aux[k]}delete user._user;if(!user.roleid)user.role=0;else{switch(user.roleid.type){case'co-owner':if(Dubtrack.room.model.toJSON().userid==user.userid)user.role=7;else user.role=6;break;case'manager':user.role=5;break;case'mod':user.role=4;break;case'vip':user.role=3;break;case'resident-dj':user.role=2;break;case'dj':user.role=1;break;default:user.role=0}}}list.push(user)}return list};API.sendChat=function(a){var c=new Dubtrack.Model.chat({user:Dubtrack.session.toJSON(),message:a,time:Date.now(),realTimeChannel:Dubtrack.room.model.get("realTimeChannel"),type:"chat-message"}),chat_context=getChatContext();if(!chat_context)return;c.urlRoot=chat_context.context.chatEndPointUrl;c.save();chat_context.context.model.add(c)};API.chatLog=function(msg,title,img){var chat=$('.chat-messages'),end=chat.scrollTop()>chat[0].scrollHeight-chat.height()-28;chat.find('.chat-main').append('<li class="user-log current-chat-user"><div class="stream-item-content"><div class="chatDelete"onclick="$(this).closest(\'li\').remove();"><span class="icon-close"></span></div><div class="image_row"><img src="'+(img||'https://res.cloudinary.com/hhberclba/image/upload/c_lpad,h_100,w_100/v1400351432/dubtrack_new_logo_fvpxa6.png')+'"alt="log"class="cursor-pointer"></div><div class="activity-row"><div class="text"><p><a href="#"class="username">'+(title||'Log message')+'</a> '+(msg||'')+'</p></div><div class="meta-info"><span class="username">'+(title||'Log message')+'</span><i class="icon-dot"></i><span class="timeinfo"></span></div></div></div></li>');if(end)chat.scrollTop(chat.prop("scrollHeight"));var cc=getChatContext();if(cc)cc.context.lastItemEl=null};API.setVolume=function(vol){if(vol<0)vol=0;if(vol>100)vol=100;vol=~~vol;$slider=$('#volume-div');$('#volume-div .ui-slider-range').css({'width':vol+'%'});$('#volume-div .ui-slider-handle').css({'left':vol+'%'});$slider.slider('option','slide')(null,{value:vol})};API.getVolume=function(){return Dubtrack.playerController.volume};API.getMedia=function(){return Dubtrack.room.player.activeSong.toJSON()};API.getLastMedia=function(){return lastMedia};API.dubup=function(){$('.dubup').click()};API.dubdown=function(){$('.dubdown').click()};API.moderateSetRole=function(userid,role,callback){var user=this.getUser(userid),self=this.getUser();if(!user||!self||self.role<2||self.role<user.role||(user.role==0&&!role))return;var url=Dubtrack.config.apiUrl+"/chat/:roleid/:roomid/user/:id".replace(':roleid',role||user.roleid._id).replace(':roomid',this.getRoom()._id).replace(':id',userid);return ajax(url,role?'POST':'DELETE',JSON.stringify({realTimeChannel:this.getRoom().realTimeChannel}),callback)};API.moderateSkip=function(callback){if(!this.getMedia().song||this.getUser().role<3)return;var url=Dubtrack.config.apiUrl+Dubtrack.config.urls.skipSong.replace(':id',this.getRoom()._id).replace(':songid',this.getMedia().song._id);return ajax(url,'POST',JSON.stringify({realTimeChannel:this.getRoom().realTimeChannel}),callback)};API.moderateDeleteChat=function(cid,callback){if(this.getUser().role<4||typeof cid!='string')return;var url=Dubtrack.config.apiUrl+Dubtrack.config.urls.deleteChat.replace(':id',this.getRoom()._id).replace(':chatid',cid);return ajax(url,'DELETE',null,callback)};API.moderateMoveDJ=function(userid,position,callback){if(this.getUser().role<4||typeof userid!='string'||typeof position!='number'||position<1||!API.getUser(userid))return;this.getRESTRoomQueue(function(data){var list=data.data,users=[];for(var i in list)users.push(list[i].userid);if(users.length<position)return;if(users.indexOf(userid)==--position)return;var pos=users.indexOf(userid);if(pos!=-1){users.splice(pos,1);users.splice(position,0,userid)}else{return}var url=Dubtrack.config.apiUrl+Dubtrack.config.urls.roomUserQueueOrder.replace(':id',API.getRoom()._id);return ajax(url,'POST',{order:users},callback,null,null)})};API.moderateBanUser=function(userid,time,callback){if(typeof userid!="string"||typeof time!="number"||time<1||this.getUser().role<4||this.getUser(userid)>0)return;var url=Dubtrack.config.apiUrl+Dubtrack.config.urls.banUser.replace(':roomid',this.getRoom()._id).replace(':id',userid);return ajax(url,'POST',JSON.stringify({time:time,realTimeChannel:this.getRoom().realTimeChannel}),callback)};API.lockQueue=function(lock,callback){if(this.getUser().role<4||typeof lock!='boolean'||API.getRoom().lockQueue==lock)return;var url='https://api.dubtrack.fm/room/:roomid/lockQueue'.replace(':roomid',this.getRoom()._id);return ajax(url,'PUT','lockQueue='+(lock?1:0),callback,null,'application/x-www-form-urlencoded')};API.getRESTRoomQueue=function(callback){var url=Dubtrack.config.apiUrl+Dubtrack.config.urls.roomQueueDetails.replace(':id',this.getRoom()._id);return ajax(url,'GET',null,callback)};API.getRESTRoomHistory=function(callback){var url=Dubtrack.config.apiUrl+Dubtrack.config.urls.roomHistory.replace(':id',this.getRoom()._id);return ajax(url,'GET',null,callback)};var _rtb=Dubtrack.realtime.callback;function getChatContext(){return Dubtrack.Events._events['realtime:chat-message'].filter(function(a){return typeof a=='object'&&typeof a.context=='object'&&a.context.chatEndPointUrl})[0]};function updateWaitList(){API.getRESTRoomQueue(function(a){waitlist=a.data})}function groupChatMessages(){if(API.chat.groupMessages)return;var chat_ctx=getChatContext();if(chat_ctx)chat_ctx.context.lastItemEl=undefined};function saveLastMedia(){lastMedia=API.getMedia()}function ajax(_url,method,parameters,func,par_to_func,ctype){return $.ajax({cache:false,type:method||'GET',url:_url,contentType:typeof ctype=='string'?ctype:(typeof ctype==='undefined'?'application/json':undefined),data:parameters}).done(function(msg){if(typeof func=='function')func(msg,par_to_func)})};function eventsDispatch(a){API.trigger('_'+a.type,a);_rtb(a);API.trigger(a.type,a);API.trigger('event',a)};Dubtrack.realtime.callback=eventsDispatch;API.on(API.events.CHAT_MESSAGE,groupChatMessages);API.on('_'+API.events.ROOM_PLAYLIST_UPDATE,saveLastMedia);API.on(API.events.ROOM_PLAYLIST_UPDATE,updateWaitList);API.on(API.events.ROOM_PLAYLIST_QUEUE_REORDER,updateWaitList);API.on(API.events.ROOM_PLAYLIST_QUEUE_UPDATE_DUB,updateWaitList);updateWaitList()})();
            }
        },
        events: {
            chat: function(obj){
                var msgData = bots.util.parseChatObj(obj);
                 
                if (!msgData) return;
                 
                var arr = msgData.msg.trim().split(' ');
                var cmd = arr.shift();
                 
                if (cmd.charAt(0) != '@') return;
                 
                cmd = cmd.substring(1).toLowerCase();
                 
                switch (cmd){
					case 'botsoff':
                        if (!msgData.staff) return;
                        bots.util.sendChat('@' + msgData.un + ' Desligando SimSimi e ED bot...');
                        bots.events.off();
                        break; 
						
                    case 'ed':
                        bots.request.send('ed','Ed',msgData,arr.join(' '));
                        break;
 
                     
                    case 'ss':
                        bots.request.send('ss','SimSimi',msgData,arr.join(' '));
                        break;
                }
            },
            on: function() {
                switch(bots.session.site) {
                    case bots.consts.PLUG:
                        return API.on(API.CHAT, bots.events.chat);
                     
                    case bots.consts.DUB:
                        return API.on(API.events.CHAT_MESSAGE, bots.events.chat);
                     
                    case bots.consts.MP:
                        return API.on(API.DATA.EVENTS.CHAT, bots.events.chat);
                }
            },
            off: function() {
                switch(bots.session.site) {
                    case bots.consts.PLUG:
                        return API.off(API.CHAT, bots.events.chat);
                     
                    case bots.consts.DUB:
                        return API.off(API.events.CHAT_MESSAGE, bots.events.chat);
                     
                    case bots.consts.MP:
                        return API.off(API.DATA.EVENTS.CHAT, bots.events.chat);
                }
            }
        },
        request: {
            send: function(bot,bn,obj,msg){
                $.ajax({
                    url : 'https://bots-caipira.rhcloud.com',
                    method: 'POST',
                    data : {bot: bot, msg: msg, origin: document.location.origin}
                })
                .done(function(data){
                    bots.request.response(obj,bn,data);
                })
                .error(function() {
                    console.log('[@' + obj.un + '] Erro ao enviar request.');
                });
            },
            response : function(obj,type, msg){
                var resp = '[%%BOT%% > @%%USER%%] %%MESSAGE%%'.replace('%%BOT%%', type).replace('%%USER%%', obj.un + (bots.session.site == bots.consts.MP ? ' ' : ''));
                try{
                    resp = resp.replace('%%MESSAGE%%', msg.resp || '[Erro] ' + msg.error);
                }catch(e){
                    resp = resp.replace('%%MESSAGE%%', msg);
                }
                bots.util.sendChat(resp.replace(/<\/?[^>]+(>|$)/g, ""));
            }
        },
        main: {
            init: function() {
                bots.session.site = bots.util.detectSite();
                 
                if (bots.session.site == -1)
                    return alert('Site nÃ£o reconhecido!');
                 
                if (bots.session.site == bots.consts.DUB)
                    bots.util.loadDubCustomAPI();
                 
                bots.events.on();
                setTimeout(function () {
					 API.sendChat("Use @ss para fazer sua pergunta!")
                 }, 2000);
				   bots.util.sendChat('SimSimi e Ed ativados');
            }
        }
    };
     
    bots.main.init();
})();
