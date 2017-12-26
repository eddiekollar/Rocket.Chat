import numeral from 'numeral';

HUBAdapter = HUBAdapter || {};

HUBAdapter.getChatRoomLabel = function(roomId) {
  const rocketChatUserId = Meteor.userId();
  const profile = HUBProfiles.find({'rocketChat._id': rocketChatUserId});
  return '';
}

HUBAdapter.formattedAmount = function(amount) {
  return numeral(amount).format('$0,0.00');
}