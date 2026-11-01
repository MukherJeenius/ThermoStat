[out:json][timeout:170][bbox:43.248,-79.885,43.276,-79.805];
(
  way[building][name]; relation[building][name][type=multipolygon];
  way[building][amenity]; way[building][office]; way[building][shop]; way[building][tourism];
  way[building][leisure]; way[building][healthcare];
  way[building~"^(apartments|residential|dormitory|commercial|mixed_use|office|retail|supermarket|hotel|hospital|school|college|university|civic|government|public|sports_hall|stadium)$"];
  way[building]["building:levels"~"^([4-9]|[1-9][0-9]+)"];
  way[building][height];
);
out body geom;
