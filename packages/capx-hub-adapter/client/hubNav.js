Template.hubNav.helpers({
  isSeeker() {
		const hubInfo = Session.get('hubInfo');
		
		return (hubInfo && hubInfo.userType === 'SEEKER');
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

Template.hubNav.onCreated(function() {
  Session.set('hubNavActive', true);
  const self = this;
  self.profile = new ReactiveVar({}); 
  self.hub = new ReactiveVar({});
  
  this.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    const profile = HUBProfiles.findOne({userId: hubInfo.userId});

    if(profile && !_.isEmpty(profile)) {
      self.profile.set(profile);

      if(hubInfo.userType === 'SEEKER') {
        const hub = HUB.findOne();
        self.hub.set(hub);
      }
    }
  });
});

Template.hubNav.onRendered(function() {
  
})