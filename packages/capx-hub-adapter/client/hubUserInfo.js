/* globals RoomRoles, UserRoles*/
import moment from 'moment';
import toastr from 'toastr';

Template.hubUserInfo.helpers({
	name() {
		const user = Template.instance().user.get();
		return user && user.name ? user.name : TAPi18n.__('Unnamed');
	},

	username() {
		const user = Template.instance().user.get();
		return user && user.username;
	},

	email() {
		const user = Template.instance().user.get();
		return user && user.emails && user.emails[0] && user.emails[0].address;
	},

	utc() {
		const user = Template.instance().user.get();
		if (user && user.utcOffset != null) {
			if (user.utcOffset > 0) {
				return `+${ user.utcOffset }`;
			}
			return user.utcOffset;
		}
	},

	lastLogin() {
		const user = Template.instance().user.get();
		if (user && user.lastLogin) {
			return moment(user.lastLogin).format('LLL');
		}
	},

	createdAt() {
		const user = Template.instance().user.get();
		if (user && user.createdAt) {
			return moment(user.createdAt).format('LLL');
		}
  },
  
  hideAdminControls() {
    //!! Check they are CS and have permission

    return false;
  },

	canDirectMessage(username) {
    //!! Possibly redirect to proper one-to-one group
    const user = Meteor.user();
    // return RocketChat.authz.hasAllPermission('create-d') && user && user.username !== username;
    return false;
	},

	isSelf(username) {
		const user = Meteor.user();
		return user && user.username === username;
	},

	userTime() {
		const user = Template.instance().user.get();
		if (user && user.utcOffset != null) {
			return Template.instance().now.get().utcOffset(user.utcOffset).format(RocketChat.settings.get('Message_TimeFormat'));
		}
	},

	canRemoveUser() {
    //!! Check 
		return true;
	},

  canRequestAddUser() {
    return false;
  },

	canSetOwner() {
		return RocketChat.authz.hasAllPermission('set-owner', Session.get('openedRoom'));
	},

	canSetLeader() {
		return RocketChat.authz.hasAllPermission('set-leader', Session.get('openedRoom'));
	},

	isOwner() {
		const user = Template.instance().user.get();
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' });
		}
	},

	isLeader() {
		const user = Template.instance().user.get();
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' });
		}
	},

	user() {
		return Template.instance().user.get();
	},

	isLoading() {
		return Template.instance().loadingUserInfo.get();
	},

	active() {
		const user = Template.instance().user.get();
		return user && user.active;
	},

	isDirect() {
    //!! Reuse for direct message in deal room
		const room = ChatRoom.findOne(Session.get('openedRoom'));

		return (room != null ? room.t : undefined) === 'd';
	},
});

Template.hubUserInfo.events({
	'click .pvt-msg'(e, instance) {
		return Meteor.call('createDirectMessage', this.username, (error, result) => {
			if (error) {
				return handleError(error);
			}

			if ((result != null ? result.rid : undefined) != null) {
				return FlowRouter.go('direct', { username: this.username }, FlowRouter.current().queryParams, function() {
					if (window.matchMedia('(max-width: 500px)').matches) {
						return instance.tabBar.close();
					}
				});
			}
		});
	},

	'click .back'(e, instance) {
		return instance.clear();
	},

	'click .remove-user'(e, instance) {
		e.preventDefault();
		const rid = Session.get('openedRoom');
		const room = ChatRoom.findOne(rid);
		const user = instance.user.get();
		if (user && RocketChat.authz.hasAllPermission('remove-user', rid)) {
			return swal({
				title: t('Are_you_sure'),
				text: t('The_user_will_be_removed_from_s', room.name),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_remove_user'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, () => {
				return Meteor.call('removeUserFromRoom', { rid, username: user.username }, (err) => {
					if (err) {
						return handleError(err);
					}
					swal({
						title: t('Removed'),
						text: t('User_has_been_removed_from_s', room.name),
						type: 'success',
						timer: 2000,
						showConfirmButton: false
					});

					return instance.clear();
				});
			});
		} else {
			return toastr.error(TAPi18n.__('error-not-allowed'));
		}
	},

	'click .set-owner'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' }, { fields: { _id: 1 } });
			if (userOwner == null) {
				return Meteor.call('addRoomOwner', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__is_now_a_owner_of__room_name_', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .unset-owner'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' }, { fields: { _id: 1 } });
			if (userOwner != null) {
				return Meteor.call('removeRoomOwner', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__removed_from__room_name__owners', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .set-leader'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' }, { fields: { _id: 1 } });
			if (userLeader == null) {
				return Meteor.call('addRoomLeader', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__is_now_a_leader_of__room_name_', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .unset-leader'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' }, { fields: { _id: 1 } });
			if (userLeader != null) {
				return Meteor.call('removeRoomLeader', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__removed_from__room_name__leaders', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .deactivate'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return Meteor.call('setUserActiveStatus', user._id, false, function(error, result) {
				if (result) {
					toastr.success(t('User_has_been_deactivated'));
				}
				if (error) {
					return handleError(error);
				}
			});
		}
	},

	'click .activate'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return Meteor.call('setUserActiveStatus', user._id, true, function(error, result) {
				if (result) {
					toastr.success(t('User_has_been_activated'));
				}
				if (error) {
					return handleError(error);
				}
			});
		}
	}
});

Template.hubUserInfo.onCreated(function() {
	this.now = new ReactiveVar(moment());
	this.user = new ReactiveVar;
	this.editingUser = new ReactiveVar;
	this.loadingUserInfo = new ReactiveVar(true);
	this.loadedUsername = new ReactiveVar;
	this.tabBar = Template.currentData().tabBar;

	Meteor.setInterval(() => {
		return this.now.set(moment());
	}, 30000);

	this.autorun(() => {
		const username = this.loadedUsername.get();

		if (username == null) {
			this.loadingUserInfo.set(false);
			return;
		}

		this.loadingUserInfo.set(true);

		return this.subscribe('fullUserData', username, 1, () => {
			return this.loadingUserInfo.set(false);
		});
	});

	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			return this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const user = this.user.get();
		return this.loadedUsername.set((user != null ? user.username : undefined) || (data != null ? data.username : undefined));
	});

	return this.autorun(() => {
		let filter;
		const data = Template.currentData();
		if (data && data.username != null) {
			filter = { username: data.username };
		} else if (data && data._id != null) {
			filter = { _id: data._id };
		}

		const user = Meteor.users.findOne(filter);

		return this.user.set(user);
	});
});
