const commands = {
  'set-hub-context'({hubData}) {
    Session.set('hubInfo', hubData);
	},
	'set-dealroom-context'({hubData}) {
		Session.set('hubInfo', hubData);
	}
};

window.addEventListener('message', (e) => {
	if (! _.isObject(e.data)) {
		return;
  }

  if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
		return;
	}
  
  const command = commands[e.data.externalCommand];
	if (command) {
		command(e.data, e);
	}
});