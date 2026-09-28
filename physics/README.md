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

Particles move aside for the pointer and a click sends out a ripple. Changing exhibit swoops the camera around. The pause button in the top bar stops the motion (the choice is remembered), and the page starts paused for anyone whose device asks for reduced motion. On a slow device the universe draws fewer particles. Without WebGL2 the page keeps its plain background and a flat 2D chain reaction on the title.

It is written directly in WebGL2. Each particle carries a few random numbers, and one shader turns them into all sixteen formations. When the scene changes, the graphics card records where every particle is (transform feedback), and they fly from there to the new shape. That keeps the flight smooth even if you change your mind halfway.

Hand-written HTML, CSS, JavaScript and GLSL. No libraries, images or videos; the only external request is for web fonts.

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
js/main.js        Starts everything; the scroll fuse and the phone diagram
```

## Accuracy

Dates, numbers and quotes are checked against the sources listed at the bottom of the page. Where a simulation exaggerates something so you can see it (the size of Rutherford's nuclei, the rate of Raman scattering, the ripples of space), the caption says so. The 3D formations are illustrations built on the same physics (Kepler's equation, dipole field lines, Coulomb hyperbolas, two-source interference, the chirp of a black hole merger), with sizes and speeds scaled to fit the screen.
