
//Found in packages/rocketchat-lib/client/defaultTabBars.js
Meteor.startup(function() {
	Tracker.autorun(function() {
		const hubInfo = Session.get('hubInfo');
		const hubRoomInfo = Session.get('hubRoomInfo');
		
		if(hubInfo && hubInfo.userType && hubRoomInfo && hubRoomInfo.type) {
			RocketChat.TabBar.removeButton('members-list');
			RocketChat.TabBar.removeButton('uploaded-files-list');

			RocketChat.TabBar.addButton({
				groups: ['channel', 'group'],
				id: 'team-members-list',
				i18nTitle: 'Members_List',
				icon: 'team',
				template: 'teamMembersList',
				order: 2
			});
			
			if(!(hubInfo.userType === 'PROVIDER' && hubRoomInfo.type === 'COMPANY')) {
				RocketChat.TabBar.addButton({
					groups: ['channel', 'group', 'direct'],
					id: 'uploaded-files-list',
					i18nTitle: 'Data_Room',
					icon: 'clip',
					template: 'dataRoom',
					order: 3
				});
			}

		}
	});
});