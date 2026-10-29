// What each TAT picture shows, in plain words. The analysis is given this text
// instead of the image, so it can judge whether a story actually grows out of
// the picture (the first thing an assessor checks) without a vision call per
// attempt. Images live in frontend/public/tat/<id>.jpg.
//
// Descriptions stay neutral on purpose: they say what is drawn, not what it
// means. Reading meaning into it is the candidate's job, and the analysis must
// accept any story the picture can honestly carry.

const TAT_PICTURES = {
  0:  'Blank slide. The candidate imagines a picture of their own and writes a story about it.',
  1:  'An older man bends over a bed where someone lies under a sheet. A young person sits up on another bed beside them in a plain room.',
  2:  'Five men sit on the floor of a village room. One man on the left points and speaks while the others listen.',
  3:  'A child is in deep water with both arms raised and only the head above the surface.',
  4:  'An older man sits on a chair. A young man in a checked shirt stands in front of him.',
  5:  'A rope bridge hangs over a rocky river gorge. One person is on the bridge, a small boat is on the river and a few people stand on the bank below.',
  6:  'Mountaineers in heavy clothing on snow with ropes and ice axes. Some are bending down; a tent is in the distance.',
  7:  'A young man walks towards a doorway where a young woman stands with her arm stretched out towards him.',
  8:  'On a staircase landing a man raises his hands while another man holds a knife behind him. A third person lies on the floor.',
  9:  'Two soldiers lie in a field beside a road lined with bare trees. One aims a rocket launcher.',
  10: 'A village elder in a turban and waistcoat talks with a young man in a field.',
  11: 'A small boat with a torn sail in a rough sea. A man struggles with the mast; a woman sits in the boat.',
  12: 'A young man and a young woman stand talking on a college campus, holding books. Two girls sit on the grass nearby.',
  13: 'A young man walks down the steps of a large old building. A sign on the door says "No Vacancy".',
  14: 'Three young men walk along a path through trees towards an old fort.',
  15: 'A group of young men stand in a circle around a person lying on the ground near a river.',
  16: 'A boy stands outside a classroom door with his head down and hands behind his back. Students sit inside.',
  17: 'A young man speaks to a crowd of students gathered under a banner.',
  18: 'A busy railway platform. A young man stands at the train door while people around him, one carrying a bag, look on.',
  19: 'A young man sits alone at a desk at night with open books and a lamp, his head resting on his hand.',
  20: 'A man stands on a rock beside a fast river holding a coiled rope. A boy in the water reaches out towards him.',
  21: 'One young man stands behind another and rests a hand on his shoulder. The seated young man looks down, sad.',
  22: 'A young man with a bag walks out of a room. An older man gestures towards him; an older woman sits on a chair.',
  23: 'Young men crowd around a notice board on a brick wall.',
  24: 'Many young men work together breaking and carrying stones with pickaxes.',
  25: 'A man in glasses sits at a desk piled with books. Two young men stand in front of him.',
  26: 'A man stands and speaks to a group of young men sitting under a large tree.',
  27: 'In a room an older man holds a young man by the arms. A woman stands close to them; a girl stands apart near a door.',
  28: 'A man points at a young woman while a young man stands beside her. A small girl holds on to the man.',
  29: 'A busy street where a car has crashed into a horse cart. The horse has fallen and people are running towards it.',
  30: 'A postman hands a letter to a boy at the door of a house.',
  31: 'Three soldiers walk away from a jeep near tents and palm trees.',
  32: 'A woman in a sari watches a small boy play with a toy tank. A garlanded photo of a soldier hangs on the wall.',
  33: 'A young man talks with a farmer who stands near a pair of bullocks in a field.',
};

module.exports = { TAT_PICTURES };
