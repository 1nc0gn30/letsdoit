import fs from 'fs';

const cities = [
  { name: 'Norfolk', baseLat: 36.8529, baseLng: -76.2840, spread: 0.04 },
  { name: 'Virginia Beach', baseLat: 36.8529, baseLng: -75.9780, spread: 0.06 },
  { name: 'Chesapeake', baseLat: 36.7116, baseLng: -76.2382, spread: 0.05 },
  { name: 'Hampton', baseLat: 37.0299, baseLng: -76.3452, spread: 0.04 },
  { name: 'Newport News', baseLat: 37.0709, baseLng: -76.4655, spread: 0.04 },
  { name: 'Portsmouth', baseLat: 36.8354, baseLng: -76.2983, spread: 0.03 },
  { name: 'Suffolk', baseLat: 36.7282, baseLng: -76.5836, spread: 0.04 },
  { name: 'Williamsburg', baseLat: 37.2707, baseLng: -76.7075, spread: 0.03 },
  { name: 'Yorktown', baseLat: 37.2388, baseLng: -76.5097, spread: 0.025 },
  { name: 'Poquoson', baseLat: 37.1221, baseLng: -76.3827, spread: 0.02 },
  { name: 'Smithfield', baseLat: 36.9824, baseLng: -76.6311, spread: 0.02 },
  { name: 'Isle of Wight', baseLat: 36.9079, baseLng: -76.7230, spread: 0.03 },
];

const tags = ['food','music','outdoors','culture','nightlife','coffee','history','entertainment','family','beach','festival','nature','sports','wellness'];

const categoryTemplates = [
  { suffixes: ['BBQ','Bistro','Grill','Kitchen','Tavern','Cafe','Diner','Steakhouse','Seafood Shack','Oyster Bar','Sushi Spot','Ramen House','Pizza Joint','Burger Bar','Taco Stand','Wing Spot','Pho House','Curry House','Brunch Spot','Bagel Shop','Deli','Smokehouse','Chophouse','Cantina','Brewpub','Crafthouse','Eatery','Bakery','Patisserie','Gastropub','Roadhouse','Noodle Bar','Hot Pot','Falafel House','Mediterranean Grill','Soul Food Kitchen','Creole Spot','Fish Fry','Lobster Roll','Poke Bowl','Sandwich Shop','Cheesesteak Spot','Ice Cream Parlor','Donut Shop','Pie Shop','Waffle House','Pancake Stack','Pasta Bar','Risotto Spot','Curry Bowl','Kebab House','Dim Sum','Tapas Bar','Wine Bar','Cocktail Lounge','Supper Club','Farm Table','Vegan Cafe','Juice Bar','Acai Spot','Boba Tea','Bubble Waffle','Food Truck Park','Rotisserie','Meat Market','Raw Bar','Po Boy Shop','Lowcountry Kitchen','Coastal Kitchen','Dockside Grill','Harbor Bistro','Bayfront Eats','Oceanview Cafe','Boardwalk Bites','Pier Snacks','Shoreline Diner','Lighthouse Cafe','Anchor Tavern','Sailor Pub','Marina Grill','Yacht Club Dining','Harbor View Restaurant','Waterfront Dining','Riverside BBQ','Canal Bistro','Ghent Eats','Downtown Diner','Neighborhood Spot','Local Hangout','Corner Store','Market Cafe','Bistro & Bar','Charcuterie Board','Cheese Shop','Butcher Block','Seafood Market','Farmers Market Eats','Pop-Up Kitchen','Chef Table','Tasting Menu','Omakase','Private Dining','Rooftop Bar','Patio Dining','Garden Cafe','Courtyard Eats','Alleyway Bistro','Speakeasy','Underground Bar','Basement Taps','Rooftop Lounge','Sky Bar','Sunset Dining','Brunch Club','Mimosa Bar','Bloody Mary Spot','Coffee & Toast','Avocado Toast','Egg Spot','Bagel Bar','Croissant House','Scone Spot','Muffin Shop','Cinnamon Roll','Pretzel Stand','Corn Dog','Funnel Cake','Cotton Candy','Candy Shop','Chocolate House','Cookie Dough','Cupcake Bakery','Cake Shop','Pie Bar','Cobbler Spot','Frozen Custard','Gelato Shop','Sorbet','Shaved Ice','Slushie Stand','Smoothie Bar','Protein Shake','Health Bar','Keto Kitchen','Paleo Cafe','Gluten Free Spot','Farm to Table'], tags: ['food'], type: 'business' },
  { suffixes: ['Coffee Roasters','Espresso Bar','Latte Lounge','Cappuccino Corner','Mocha Spot','Cold Brew Lab','Pour Over Station','Nitro Tap','Bean Brokers','Coffee Collective','Cafe Society','Brew Lab','Roast House','Cupping Room','Barista Bar','Caffeine Fix','Morning Brew','Drip Drop','Percolator','French Press','Aeropress Lab','Siphon Bar','Chemex Spot','Moka Pot','Coffee Cart','Drive Thru Coffee','Walk-Up Window','Espresso Stand','Coffee Kiosk','Bookstore Cafe','Study Spot','Remote Work Cafe','Laptop Friendly','WiFi Cafe','Music Cafe','Jazz Coffee','Poetry Cafe','Art Cafe','Gallery Coffee'], tags: ['coffee'], type: 'business' },
  { suffixes: ['Brewing Co','Craft Brewery','Nano Brewery','Taproom','Beer Garden','Biergarten','Ale House','Lager Lounge','Pilsner Pub','Stout Spot','IPA Bar','Sour Bar','Barrel House','Brewpub','Distillery','Cocktail Bar','Mixology Lab','Whiskey Den','Rum Bar','Tequila Spot','Mezcaleria','Wine Lounge','Sake Bar','Champagne Bar','Mimosa Bar','Bellini Bar','Dive Bar','Neighborhood Bar','Sports Bar','Pool Hall','Dart Bar','Karaoke Bar','Dance Club','DJ Lounge','Electronic Club','Reggae Bar','Jazz Club','Blues Bar','Rock Bar','Country Bar','Honky Tonk','Irish Pub','English Pub','German Beer Hall','Tiki Bar','Beach Bar','Boardwalk Bar','Rooftop Bar','Sky Lounge','Sunset Bar','Harbor Bar','Dock Bar','Marina Lounge','Yacht Bar','Piano Bar','Comedy Club'], tags: ['nightlife'], type: 'business' },
  { suffixes: ['Park','Nature Preserve','Wildlife Refuge','Wetlands Trail','Boardwalk','Nature Trail','Hiking Trail','Bike Path','Greenway','Linear Park','Community Park','Dog Park','Skate Park','Disc Golf Course','Golf Course','Tennis Courts','Basketball Courts','Baseball Field','Soccer Complex','Running Track','Fitness Trail','Outdoor Gym','Kayak Launch','Canoe Ramp','Boat Ramp','Marina','Fishing Pier','Crabbing Dock','Campground','RV Park','Picnic Area','Pavilion','Shelter','Gazebo','Rose Garden','Botanical Walk','Arboretum','Forest Trail','Woodland Path','Meadow Walk','Creek Trail','Lake Park','Pond Park','Fountain Park','Splash Pad','Sprayground','Pool Complex','Rec Center','Athletic Field','Sports Complex','Stadium','Arena','Velodrome','BMX Track','Pump Track','Rock Climbing Wall','Obstacle Course','Adventure Park','Zipline Park','Ropes Course','Aerial Park','Tree Climbing'], tags: ['outdoors'], type: 'business' },
  { suffixes: ['Beach Access','Surf Spot','Swimming Beach','Lifeguard Station','Beach Pavilion','Oceanfront Park','Boardwalk Segment','Pier','Fishing Pier','Observation Deck','Dune Trail','Marsh Overlook','Tidal Pool','Wade In Area','Calm Water Beach','Wave Beach','Sunset Beach','Sunrise Point','Bay Beach','Inlet Beach','Cove Beach','Jetty Walk','Breakwater Path','Harbor Beach','River Beach'], tags: ['beach'], type: 'business' },
  { suffixes: ['Museum','Art Gallery','Studio','Exhibit Hall','Cultural Center','Heritage Center','History Center','Archive','Library','Planetarium','Science Center','Discovery Center','Childrens Museum','Hands-On Museum','Interactive Exhibit','Art Collective','Maker Space','Craft Workshop','Pottery Studio','Glass Blowing Studio','Woodworking Shop','Metalworking','Print Shop','Letterpress','Screen Printing','Photography Studio','Film Lab','Theater','Playhouse','Black Box Theater','Amphitheater','Concert Hall','Opera House','Symphony Hall','Recital Hall','Dance Studio','Ballet Academy','Music School','Art School','Design School','Fashion Studio','Textile Workshop','Weaving Studio','Jewelry Studio','Sculpture Garden','Installation Art','Street Art Walk'], tags: ['culture'], type: 'business' },
  { suffixes: ['Historic Site','Battlefield','Civil War Trail','Revolutionary War Site','Colonial Home','Plantation House','Manor House','Historic Mansion','Victorian House','Antebellum Home','Church','Historic Church','Cemetery','National Cemetery','Memorial','Monument','Statue','Plaza','Town Square','Courthouse','Old Jail','Lighthouse','Light Station','Keepers House','Fort','Battery','Earthworks','Trench Line','Barracks','Armory','Shipyard','Dry Dock','Canal Lock','Mill','Gristmill','Sawmill','Covered Bridge','Old Bridge','Ferry Landing','Stagecoach Stop','Tavern Inn','Historic Hotel'], tags: ['history'], type: 'business' },
  { suffixes: ['Arcade','Bowling Alley','Mini Golf','Go-Kart Track','Escape Room','Axe Throwing','Laser Tag','VR Lounge','Esports Arena','Game Cafe','Board Game Bar','Trivia Night','Bingo Hall','Casino','Racing Sim','Flight Sim','Golf Sim','Topgolf','Driving Range','Batting Cages','Trampoline Park','Bounce House','Inflatable Park','Water Park','Lazy River','Wave Pool','Slide Complex','Kiddie Pool','Roller Rink','Ice Rink','Cinema','IMAX Theater','Drive-In Theater','Outdoor Cinema','Film Festival Venue','Comedy Club','Improv Theater','Open Mic','Poetry Slam','Karaoke Night','Dance Party','Silent Disco','Foam Party','Glow Party','Theme Night'], tags: ['entertainment'], type: 'business' },
  { suffixes: ['Playground','Splash Park','Spray Park','Wading Pool','Kiddie Cove','Petting Zoo','Pony Rides','Carousel','Train Ride','Mini Train','Ferris Wheel','Carnival Grounds','Fairgrounds','4H Center','Scout Camp','Day Camp','Summer Camp','Nature Camp','STEM Center','Robotics Lab','Coding Camp','Chess Club','Story Time Spot','Kids Library','Teen Center','Youth Center','Family Center','Parent Resource','Birthday Venue','Party Room','Bounce Zone','Climbing Zone','Ninja Course'], tags: ['family'], type: 'business' },
  { suffixes: ['Gym','Fitness Center','CrossFit Box','Yoga Studio','Pilates Studio','Spin Studio','Barre Studio','Dance Fitness','Zumba Class','Kickboxing Gym','Boxing Gym','MMA Gym','BJJ Academy','Wrestling Club','Fencing Club','Archery Range','Shooting Range','Gun Club','Tennis Club','Racquet Club','Squash Courts','Pickleball Courts','Badminton Club','Table Tennis Club','Volleyball Courts','Beach Volleyball','Cricket Pitch','Rugby Field','Lacrosse Field','Field Hockey','Ice Hockey Rink','Curling Club','Speed Skating','Figure Skating','Swim Club','Masters Swimming','Triathlon Club','Running Club','Trail Running','Ultra Running','Obstacle Racing','Spartan Training','Tough Mudder Prep','Color Run Spot','Parkour Gym'], tags: ['sports'], type: 'business' },
  { suffixes: ['Spa','Day Spa','Med Spa','Massage Studio','Acupuncture Clinic','Chiropractor','Physical Therapy','Float Tank','Salt Cave','Infrared Sauna','Steam Room','Hammam','Hot Springs','Mineral Bath','Hydrotherapy','Cryotherapy','IV Drip Bar','Vitamin Shot','Nutritionist','Dietitian','Holistic Health','Reiki Studio','Crystal Shop','Sound Bath','Breathwork Studio'], tags: ['wellness'], type: 'business' },
  { suffixes: ['Mall','Shopping Center','Outlet Mall','Boutique','Thrift Store','Antique Mall','Farmers Market','Flea Market','Craft Market','Artisan Market','Pop-Up Market','Night Market','Bookstore','Record Shop','Vintage Clothing','Surf Shop','Skate Shop','Bike Shop','Outdoor Gear','Tackle Shop','Gift Shop','Souvenir Stand'], tags: ['culture'], type: 'business' },
  { suffixes: ['Music Hall','Concert Venue','Live Music Bar','Jazz Lounge','Blues Club','Rock Venue','Country Venue','Rap Battle Spot','Open Mic Night','Acoustic Room','Piano Bar','DJ Spot','Electronic Venue','Folk House','Bluegrass Barn','Orchestra Pit','Choir Hall','Marching Band Field','Drum Circle','Street Performer Zone','Band Shell','Amphitheater Stage','Rooftop Stage','Backyard Stage','Warehouse Rave'], tags: ['music'], type: 'business' },
  { suffixes: ['Spring Festival','Summer Solstice Party','Fall Harvest Fest','Winter Wonderland','Holiday Market','New Years Eve Bash','Valentines Dinner Dance','St Patricks Day Parade','Easter Egg Hunt','Earth Day Cleanup','Arbor Day Planting','May Day Festival','Memorial Day Ceremony','Juneteenth Celebration','Fourth of July Fireworks','Labor Day BBQ','Halloween Haunt','Thanksgiving Turkey Trot','Christmas Tree Lighting','Kwanzaa Feast','Diwali Celebration','Lunar New Year','Cinco de Mayo Party','Oktoberfest','Wine Harvest','Oyster Roast','Crab Feast','Shrimp Boil','Clam Bake','Lowcountry Boil','Pig Pickin','Chicken Wing Fest','Chili Cookoff','BBQ Championship','Rib Fest','Burger Battle','Pizza Throwdown','Taco Tuesday Fest','Sushi Showdown','Craft Beer Week','Cocktail Week','Restaurant Week','Tasting Tour','Food Truck Rally','Brunch Fest','Farm to Table Dinner','Pop-Up Dinner','Secret Supper','Art Walk','Gallery Hop','Studio Tour','Makers Faire','DIY Festival','Film Festival','Short Film Night','Documentary Screening','Indie Music Fest','Jazz Weekend','Blues Festival','Folk Fest','Reggae Fest','Classical Under the Stars'], tags: ['festival'], type: 'event' },
];

let idCounter = 1;
const places = [];
const emojis = ['📍','🍽️','🍺','☕','🌳','🏖️','🎨','🏛️','🎢','👪','⚽','🧘','🛍️','🎵','🎊','🎬','🎤','🏕️','🦅','🌅','⛵','🍷','🥗','🍕','🍣','🌮','🍩','🍦','🥞','🥐'];
const streets = ['Main','Ocean','Virginia','Atlantic','Chesapeake','Hampton','Shore','Colonial','Independence','Victory'];
const suffixes = ['St','Ave','Blvd','Dr','Ln','Way','Rd','Pkwy'];

function makePlace(city, template, suffix, extraTags = []) {
  const lat = city.baseLat + (Math.random() - 0.5) * city.spread * 2;
  const lng = city.baseLng + (Math.random() - 0.5) * city.spread * 2;
  const name = `${suffix} — ${city.name}`;
  const allTags = [...new Set([...template.tags, ...extraTags])];
  const validTags = allTags.filter(t => tags.includes(t));
  if (validTags.length === 0) validTags.push(template.tags[0]);
  const address = `${Math.floor(Math.random()*8000)+100} ${streets[Math.floor(Math.random()*streets.length)]} ${suffixes[Math.floor(Math.random()*suffixes.length)]}, ${city.name}, VA`;
  return {
    id: String(idCounter++),
    name,
    description: `A local favorite in ${city.name} worth checking out.`,
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
    tags: validTags.slice(0, 3),
    type: template.type,
    address,
    emoji: emojis[Math.floor(Math.random()*emojis.length)],
  };
}

for (const city of cities) {
  for (const template of categoryTemplates.filter(t => t.type === 'business')) {
    const count = Math.max(2, Math.floor(template.suffixes.length / cities.length));
    const shuffled = template.suffixes.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < count && i < shuffled.length; i++) {
      let extra = [];
      if (template.tags.includes('food')) extra = [['nightlife','family','coffee','outdoors'][Math.floor(Math.random()*4)]];
      else if (template.tags.includes('nightlife')) extra = [['food','music','entertainment'][Math.floor(Math.random()*3)]];
      else if (template.tags.includes('outdoors')) extra = [['nature','sports','family','beach'][Math.floor(Math.random()*4)]];
      else if (template.tags.includes('culture')) extra = [['history','music','family'][Math.floor(Math.random()*3)]];
      else if (template.tags.includes('entertainment')) extra = [['family','nightlife','food'][Math.floor(Math.random()*3)]];
      else if (template.tags.includes('family')) extra = [['food','entertainment','outdoors'][Math.floor(Math.random()*3)]];
      else if (template.tags.includes('sports')) extra = [['wellness','outdoors','family'][Math.floor(Math.random()*3)]];
      else if (template.tags.includes('music')) extra = [['nightlife','culture','food'][Math.floor(Math.random()*3)]];
      places.push(makePlace(city, template, shuffled[i], extra));
    }
  }
}

for (const city of cities) {
  const eventTemplate = categoryTemplates.find(t => t.type === 'event');
  const count = Math.max(3, Math.floor(eventTemplate.suffixes.length / cities.length));
  const shuffled = eventTemplate.suffixes.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < count && i < shuffled.length; i++) {
    const extra = [['food','music','culture','family','nightlife','outdoors','beach'][Math.floor(Math.random()*7)]];
    places.push(makePlace(city, eventTemplate, shuffled[i], extra));
  }
}

const seen = new Set();
const unique = [];
for (const p of places) {
  if (!seen.has(p.name)) {
    seen.add(p.name);
    unique.push(p);
  }
}

while (unique.length < 500) {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  const suffix = template.suffixes[Math.floor(Math.random() * template.suffixes.length)];
  const p = makePlace(city, template, suffix);
  if (!seen.has(p.name)) {
    seen.add(p.name);
    unique.push(p);
  }
}

unique.forEach((p, i) => { p.id = String(i + 1); });

const header = `export type Tag = 'food' | 'music' | 'outdoors' | 'culture' | 'nightlife' | 'coffee' | 'history' | 'entertainment' | 'family' | 'beach' | 'festival' | 'nature' | 'sports' | 'wellness';

export interface Place {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  tags: Tag[];
  type: 'business' | 'event';
  address: string;
  emoji: string;
}

export const availableTags: { id: Tag; label: string; icon: string }[] = [
  { id: 'food', label: 'Food & Dining', icon: '🍔' },
  { id: 'coffee', label: 'Coffee Shops', icon: '☕' },
  { id: 'music', label: 'Live Music', icon: '🎵' },
  { id: 'outdoors', label: 'Outdoors & Parks', icon: '🌲' },
  { id: 'culture', label: 'Art & Culture', icon: '🎨' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'nightlife', label: 'Nightlife & Drinks', icon: '🍸' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎢' },
  { id: 'family', label: 'Family Friendly', icon: '👪' },
  { id: 'beach', label: 'Beach Fun', icon: '🏖️' },
  { id: 'festival', label: 'Festivals', icon: '🎊' },
  { id: 'nature', label: 'Nature & Wildlife', icon: '🦌' },
  { id: 'sports', label: 'Sports & Fitness', icon: '⚽' },
  { id: 'wellness', label: 'Health & Wellness', icon: '🧘' },
];

export const hamptonRoadsPlaces: Place[] = `;

const footer = `;\n`;

const content = header + JSON.stringify(unique, null, 2) + footer;
fs.writeFileSync('/home/neo/Desktop/letsdoit/src/data/places.ts', content);
console.log(`Generated ${unique.length} places into places.ts`);
