# Chain Reaction

Twelve physicists, twelve discoveries, twelve live experiments, and the world each discovery set off.

Behind the whole page floats a 3D universe of tens of thousands of glowing particles. It opens with a burst from a single point, and as you move through the story it rebuilds itself into each discovery. A glowing "fuse" runs down the page and lights each chapter as you scroll. Every chapter has the physicist's story, a simulation you can play with, and a timeline of what the discovery led to. The page ends with the parts of your phone that exist because of these discoveries.

| Year | Physicist | Discovery | Live experiment |
|------|-----------|-----------|-----------------|
| 1638 | Galileo Galilei | Everything falls the same way | Hammer and feather in air, vacuum and on the Moon |
| 1687 | Isaac Newton | Gravity and orbits | Newton's cannon: fall, orbit or escape |
| 1831 | Michael Faraday | Electromagnetic induction | Drag a magnet through a coil to light a bulb |
| 1865 | James Clerk Maxwell | Light is an electromagnetic wave | The spectrum from radio to gamma rays |
| 1898 | Marie Curie | Radioactivity | 400 atoms decaying, and the half-life curve |
| 1905 | Albert Einstein | Special relativity | Light clocks and time dilation |
| 1911 | Ernest Rutherford | The atomic nucleus | Gold-foil scattering: plum pudding vs nucleus |
| 1913 | Niels Bohr | Energy levels | Hydrogen's spectrum, built photon by photon |
| 1924 | Louis de Broglie | Matter waves | The double-slit experiment with electrons |
| 1928 | C. V. Raman | Raman scattering | A laser, a sample and its color fingerprint |
| 1938 | Lise Meitner | Nuclear fission | A chain reaction with control rods |
| 2015 | Weiss, Thorne & Barish (LIGO) | Gravitational waves | Black holes merging, with the chirp as sound |

## Getting around

You never have to scroll past eleven people to reach the twelfth:

- **The chain map.** Every physicist sits on a lane for their branch of physics (motion, space and time, light, atoms, quantum), with lines showing whose idea each one built on. Hover to see the links light up; click to open that physicist.
- **Exhibit mode.** Opens one physicist at a time, like a room in a museum. Step through with the ← → keys or the bottom bar, jump anywhere with its twelve dots, and press Esc or Map to go back. Links such as `#exhibit-curie` open an exhibit directly.
- **Built on / Led to.** Every chapter links to the discoveries it grew from and the ones it made possible, so you can follow the chain of ideas instead of the calendar.
- **Find** (press `/` or Ctrl+K). Search by name, by discovery, or by what a discovery gave us: "GPS" finds Einstein, "Wi-Fi" finds Maxwell, "cancer" finds Curie, "your phone" finds six of them.
- **Light the fuse.** The original long read is still there for anyone who wants all twelve in order.
- **Present mode** (press `P`, or the Present button). The story as full-screen slides over the 3D scenes, for showing in class: a title, the twelve discoveries and a last word. Move with the arrow keys, clicks or swipes, or turn on autoplay. Full screen works where the browser allows it.

## The look

- **A color for each branch of physics.** Every chapter wears its lane's color from the chain map (blue for motion and gravity, orange for space and time, green for electricity and light, amber for atoms and nuclei, pink for quantum). The fuse down the side keeps the color of each chapter you have passed, and a slim twelve-part bar under the top bar fills in as you read. Every accent keeps at least 7:1 contrast on the page.
- **The year turns over.** When the fuse reaches a chapter, the digits that differ from the last discovery's year spin like an odometer and land on the new one: 1905 to 1911 turns only the last two digits, 1938 to 2015 turns all four.
- **Headlines rise into place** word by word, and each experiment, quote and timeline slides up the first time it comes into view.
- **Instrument frames.** Each experiment has a header strip (its number, its branch and a live light) and viewfinder corners on the stage.
- **Light under the pointer.** The outlined word REACTION on the title fills with all five colors where the pointer passes (a spark runs through it once as the page opens), and panels and cards light up along their edge near the pointer. The page ends with the title again, huge, outlined and lit the same way.

With Motion turned off in Display nothing moves: headlines, years and panels are simply there. If the web fonts can't load, the giant title lines shrink to fit the wider fallback typeface instead of running off the screen.

## The 3D universe

Each part of the page has its own formation, worked out on the graphics card:

| Where | What the particles become |
|-------|---------------------------|
| Title | A uranium core. Fission fronts sweep through it with neutrons racing ahead. Click to start one yourself |
| Chain map | The twelve discoveries on a spiral rising through time, with ideas flowing along the links. Hovering a physicist on the map lights up their star |
| Galileo | A fountain of parabolas, everything falling with the same *g* |
| Newton | Planets on Kepler ellipses, fast near the Sun and slow far out, and a comet whose tail points away from it |
| Faraday | A magnet moving through a coil, its field lines, and a bulb that lights when the magnet moves |
| Maxwell | Electric and magnetic fields at right angles in one light wave, shortening from radio to violet |
| Curie | A nucleus firing alpha, beta and gamma rays |
| Einstein | Space curved by the Sun, a planet circling in the dip and starlight bending past it |
| Rutherford | Alpha particles on Coulomb hyperbolas through gold foil, a few bouncing back |
| Bohr | Electrons on fixed orbits, and photons in hydrogen's four visible colors |
| de Broglie | Waves from two slits interfering, with stripes building on a screen |
| Raman | A benzene molecule breathing (its strongest Raman line) in a green laser |
| Meitner | A nucleus that takes a neutron, stretches like a drop and splits |
| LIGO | Two black holes spiraling together, with space rippling in a two-armed spiral |
| Your phone | GPS satellites in six orbital planes, signals converging on one phone |
| The next link | A spiral galaxy |

Particles move aside for the pointer and a click sends out a ripple (at most about three a second, so fast clicking can't make the screen strobe). Changing exhibit swoops the camera around. On a slow device the universe draws fewer particles. Without WebGL2 the page keeps its plain background and a flat 2D chain reaction on the title.

The text always comes first. By default (Calm) the universe is bright on the title, the map and in Present mode, flares up for a moment as each new chapter begins, and then fades to a faint glow while you read. Every block of text also sits on a soft pool of shadow, so a particle never crosses a letter at full brightness: even in the worst case, gray text keeps at least 5.6:1 contrast.

It is written directly in WebGL2. Each particle carries a few random numbers, and one shader turns them into all sixteen formations. When the scene changes, the graphics card records where every particle is (transform feedback), and they fly from there to the new shape. That keeps the flight smooth even if you change your mind halfway.

Hand-written HTML, CSS, JavaScript and GLSL. No libraries, images or videos; the only external request is for web fonts.

## Made for everyone

The **Display** button in the top bar (or the second skip link, for keyboard users) opens a panel where every change shows straight away and is saved on the device:

| Setting | Choices |
|---------|---------|
| Easiest reading | One tap: 130% text, high contrast, the easy-to-read typeface, wide spacing and no motion. Tap again to undo |
| 3D background | Vivid, Calm (the default) or Off |
| Text size | 100%, 115%, 130% or 150%. The layout, the chain map and the top bar all adapt, down to a 320 px phone |
| Contrast | Standard or High: white text, brighter colors, stronger lines, solid panels |
| Typeface | Classic or Easy to read ([Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/), made for low vision) |
| Spacing | Normal or Wide: more room between lines, words and paragraphs |
| Motion | On or Off. Off stills the universe, page animations and every experiment |
| Read-aloud speed | Slow, normal or fast |
| Keyboard shortcuts | On or Off. Off keeps single keys like `/` and `P` from doing anything, for speech control and switch users |

Anything left alone follows the device: reduced motion, more contrast, reduced transparency and Windows high contrast (forced colors) are all respected.

**Listen.** Every chapter has a Listen button that reads it aloud with the browser's own voice: the name, the story, the quote, the experiment and what it set off. The paragraph being read is highlighted and kept in view, and a small player pauses, skips paragraphs, changes speed or stops.

Everything works with a keyboard and a screen reader: skip links, labeled controls, focus that stays inside dialogs and returns where it came from, live readouts in every experiment, and a text description for every canvas. The page passes an automated [axe](https://github.com/dequelabs/axe-core) check with no violations at desktop and phone sizes, with the panel open, in Easiest reading, while reading aloud and in Present mode. Printing gives black text on white paper, without the controls.

## Run it

Open `index.html` in any modern browser. With GitHub Pages enabled for this repository, it is served at `https://<username>.github.io/<repository>/physics/`.

## Files

```
index.html        The page: every chapter's story, facts and sources
css/styles.css    The dark "bubble chamber" design
js/core.js        Shared helpers: canvas sizing, animation loop, charts
js/reactor.js     Neutron chain reaction: the Meitner reactor, and the 2D title without WebGL2
js/galileo.js … js/ligo.js   One file per experiment
js/navigator.js   The chain map, exhibit mode, lineage links and Find
js/cosmos.js      The 3D universe: WebGL2 particles, formations, camera and pointer
js/cinema.js      Present mode
js/prefs.js       The reader's display choices, applied before the first paint
js/display.js     The Display panel
js/listen.js      Read aloud
js/flair.js       Chapter colors, the odometer year, reveals, instrument frames, pointer light
js/main.js        Starts everything; the scroll fuse and the phone diagram
```

## Accuracy

Dates, numbers and quotes are checked against the sources listed at the bottom of the page. Where a simulation exaggerates something so you can see it (the size of Rutherford's nuclei, the rate of Raman scattering, the ripples of space), the caption says so. The 3D formations are illustrations built on the same physics (Kepler's equation, dipole field lines, Coulomb hyperbolas, two-source interference, the chirp of a black hole merger), with sizes and speeds scaled to fit the screen.
