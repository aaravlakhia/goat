# Chain Reaction

Twelve physicists, twelve discoveries, twelve live experiments, and the world each discovery set off.

A glowing "fuse" runs down the page and lights each chapter as you scroll. Every chapter has the physicist's story, a simulation you can play with, and a timeline of what the discovery led to. The page ends with the parts of your phone that exist because of these discoveries.

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

Hand-written HTML, CSS and JavaScript. No libraries, images or videos; the only external request is for web fonts.

## Run it

Open `index.html` in any modern browser. With GitHub Pages enabled for this repository, it is served at `https://<username>.github.io/<repository>/physics/`.

## Files

```
index.html        The page: every chapter's story, facts and sources
css/styles.css    The dark "bubble chamber" design
js/core.js        Shared helpers: canvas sizing, animation loop, charts
js/reactor.js     Neutron chain reaction: the hero and the Meitner reactor
js/galileo.js … js/ligo.js   One file per experiment
js/navigator.js   The chain map, exhibit mode, lineage links and Find
js/main.js        Starts everything; the scroll fuse and the phone diagram
```

## Accuracy

Dates, numbers and quotes are checked against the sources listed at the bottom of the page. Where a simulation exaggerates something so you can see it (the size of Rutherford's nuclei, the rate of Raman scattering, the ripples of space), the caption says so.
