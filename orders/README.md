# Orders of Magnitude

One scroll from the edge of the observable universe to the inside of a proton: forty-four powers of ten, and twelve great discoveries in physics, each met at the size of the thing it explained.

Scroll, and the view zooms in. Every step makes the world ten times smaller. The big number in the corner shows how many meters fit across your view, from 10²⁷ down to 10⁻¹⁷.

| Size | Where you are | Discovery |
|------|---------------|-----------|
| 10²⁶ m | The observable universe, and a ripple heading our way | |
| 10²¹ m | The Milky Way, with Andromeda and the Magellanic Clouds | |
| 10¹⁷ m | The nearest stars, at their real distances | |
| 10¹³ m | The Solar System, with Halley’s Comet | |
| 10⁹ m | The Earth and the Moon’s orbit | 1687 · Newton: the Moon is falling |
| 10⁸ m | GPS satellites over a globe with real coastlines | 1905 · Einstein: time runs at different speeds |
| 10² m | The Leaning Tower of Pisa, after a fall through the clouds | 1638 · Galileo: heavy things don’t fall faster |
| 10⁻¹ m | A coil, a magnet and a galvanometer | 1831 · Faraday: moving magnets make electricity |
| 10⁻² m | A speck of radium in a cloud chamber | 1898 · Curie: atoms are not forever |
| 10⁻⁴ m | A human hair and red blood cells | |
| 10⁻⁶ m | Light waves, each color at its true wavelength | 1865 · Maxwell: light is an electromagnetic wave |
| 10⁻⁸ m | Molecules of benzene | 1928 · Raman: light comes back a new color |
| 10⁻⁹ m | A hydrogen atom | 1913 · Bohr: electrons live on fixed levels |
| 10⁻⁹ m | The same atom, as waves | 1924 · de Broglie: matter is a wave |
| 10⁻¹³ m | Alpha particles past a gold nucleus | 1911 · Rutherford: the atom is almost empty |
| 10⁻¹⁴ m | A uranium nucleus splitting | 1938 · Meitner: the nucleus can split |
| 10⁻¹⁵ m | Inside a proton | |
| 10⁻¹⁷ m | The size of LIGO’s measurement | 2015 · LIGO: space itself can ripple |

The journey opens and closes with the same event: a gravitational wave from two black holes, first seen as a ripple crossing the universe, last as a stretch of space 1/400 of the width of a proton.

## Using it

- **Scroll** (or swipe) to zoom. Each stop holds still while you read its note.
- **Play the journey** zooms by itself and pauses at each discovery, for a projector or a class.
- **Space** or **↓** moves to the next stop and **↑** goes back.
- The **ruler** on the right has a dot for every stop; click one to fly there. Links in the notes ("Built on Galileo, 1638") fly across sizes too.
- At the end, **Fly back out to the start** zooms all the way back up through every size.
- After the journey, a table lists the twelve discoveries by date with the size each one appears at, followed by questions for a lesson and the sources.

## What is to scale

Every size is to scale, measured across the shorter side of the screen. The orbits follow Kepler’s laws, the alpha particles follow real Coulomb paths for 7.7 MeV alphas on gold, the light waves have their true wavelengths, the nearest stars sit at their real distances, and the cloud-chamber trails have the real ranges of radium’s alpha particles in air. Three things are drawn bigger than life so you can see them: the falling balls at Pisa, the light among the benzene molecules, and the speed of everything that moves. The Earth’s coastlines come from Natural Earth map data.

## Made for everyone

The notes are ordinary text in the page, so a screen reader reads the whole journey in order, and tabbing into a note brings its stop into view. Arriving at a stop by keyboard or Play announces it. With reduced motion turned on in your device settings, the scenes hold still and jumps happen instantly. Printing gives every note in order, black on white, then the table and sources. The page passes an automated [axe](https://github.com/dequelabs/axe-core) check at desktop and phone sizes.

## Run it

Open `index.html` in any modern browser. With GitHub Pages enabled for this repository it is served at `https://<username>.github.io/<repository>/orders/`.

The earlier version of this project, *Chain Reaction*, is still in `physics/`.

## Files

```
index.html       The page: the journey's notes, the table, the sources
css/styles.css   Layout and type
js/land.js       Where the land is: Natural Earth 1:50m, compressed
js/util.js       Shared drawing helpers and the list of scenes
js/space.js      The universe, the Milky Way, the nearest stars, the Solar System
js/earth.js      The globe, the Moon's orbit, GPS, the clouds
js/ground.js     Pisa, Faraday's coil, the cloud chamber, a hair
js/small.js      Light, molecules, the atom, nuclei, a proton, LIGO
js/journey.js    Scroll to size, the notes, the readout, the ruler, Play and keys
```

Hand-written HTML, CSS and JavaScript, drawn on a canvas; no libraries, images or videos. The only external request is for the fonts (Bodoni Moda, Hanken Grotesk and DM Mono).

Inspired by *Powers of Ten*, the 1977 film by Charles and Ray Eames.
