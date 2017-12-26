//import { HUBProfiles } from "meteor/capx-hub-adapter";

/* globals menu*/

Template.sideNav.helpers({
	flexTemplate() {
		return SideNav.getFlex().template;
	},

	flexData() {
		return SideNav.getFlex().data;
	},

	footer() {
		return RocketChat.settings.get('Layout_Sidenav_Footer');
	},

	roomType() {
		const roomTypes = RocketChat.roomTypes.getTypes();
		return _.where(roomTypes, {identifier: 'p'});
	},

	loggedInUser() {
		return !!Meteor.userId();
	},

	isInCsCompany() {
		const profile = Template.instance().profile.get();
		let isInCsCompany = false;

		if(!_.isEmpty(profile)) {
			isInCsCompany = profile.companyId.indexOf('CS') > -1;
		}
		
		return isInCsCompany;
	},

	hubAmount() {
		const hub = Template.instance().hub.get();
		let amount = '';
		if(!_.isEmpty(hub)) {
			amount = HUBAdapter.formattedAmount(hub.transaction.total);
		}

		return amount;
	},

	hubType() {
		const hub = Template.instance().hub.get();
		let type = '';
		if(!_.isEmpty(hub)) {
			type = hub.transaction.type;
		}

		return type;
	}
});

Template.sideNav.events({
	'click .close-flex'() {
		return SideNav.closeFlex();
	},

	'click .arrow'() {
		return SideNav.toggleCurrent();
	},

	'mouseenter .header'() {
		return SideNav.overArrow();
	},

	'mouseleave .header'() {
		return SideNav.leaveArrow();
	},

	'scroll .rooms-list'() {
		return menu.updateUnreadBars();
	},

	'dropped .sidebar'(e) {
		return e.preventDefault();
	}
});

Template.sideNav.onRendered(function() {
	SideNav.init();
	menu.init();

	const first_channel_login = RocketChat.settings.get('First_Channel_After_Login');
	const room = RocketChat.roomTypes.findRoom('c', first_channel_login, Meteor.userId());
	if (room !== undefined && room._id !== '') {
		FlowRouter.go(`/channel/${ first_channel_login }`);
	}

	return Meteor.defer(() => menu.updateUnreadBars());
});

Template.sideNav.onCreated(function() {
	this.mergedChannels = new ReactiveVar(false);

	this.autorun(() => {
		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.roomsListExhibitionMode': 1,
				'settings.preferences.mergeChannels': 1
			}
		});
		let userPref = null;
		if (user && user.settings && user.settings.preferences) {
			userPref = user.settings.preferences.roomsListExhibitionMode === 'category' && user.settings.preferences.mergeChannels;
		}

		this.mergedChannels.set((userPref != null) ? userPref : RocketChat.settings.get('UI_Merge_Channels_Groups'));
	});

	const self = this;
	self.profile = new ReactiveVar({}); 
	Session.set('HUBProfile', {});
	this.subscribe('profile.get', function(){
		const rocketChatId = Meteor.userId();
		const profile = HUBProfiles.findOne({'rocketChat._id': rocketChatId});
		self.profile.set(profile);
		Session.set('HUBProfile', profile);
	});

	self.hub = new ReactiveVar({});

	this.subscribe('hub.get',function() {
		const rocketChatId = Meteor.userId();
		const profile = HUBProfiles.findOne({'rocketChat._id': rocketChatId});
		const hub = HUB.findOne();
		self.hub.set(hub);
		const companyTeam = Team.findOne({type: 'COMPANY', $or: [{ownerUserIds: {$in: [profile.userId]}}, {leaderUserIds: {$in: [profile.userId]}}, {memberUserIds: {$in: [profile.userId]}}]});

		
	});
});
