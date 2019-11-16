
# Rock Paper Automata

Cellular automata playing rock-paper-scissors in an HTML5 canvas.

![](screenshot.png)

In this simulation, every pixel acts as an automaton. In the likes of [John Conway](https://en.wikipedia.org/wiki/John_Horton_Conway)'s [Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life), at each iteration, each cell looks to its neighbors to decide what will happen next. Unlike Conway's game, though, here the idea is that there are three categories of automata, each represented by a different color. Here's where the rock-paper-scissors analogy comes into play. Whenever a cell of a certain category is confronted with another of a different category, it will either eat or be eaten by the other. The rules here are:

- C eats B
- B eats A
- A eats C

It is the cyclic dependency on the food chain that helps keep a balanced simulation where all three categories are always present. Well, choosing a good initial state also helps (my implementation simply divides the canvas into 3 fairly divided sectors).

While trying different configurations, I ended up with the current set of rules I use. In my implementation, for each cell, I pick one adjacent neighbor at random. Picking randomly generated the squiggly effect that can be seen in the simulation. To keep it simple, I use the [Von Neumann neighborhood](https://en.wikipedia.org/wiki/Von_Neumann_neighborhood). Once a neighbor is chosen, I check whether it can eat the current cell being evaluated. Before checking the rock-paper-scissors rules stated above, however, I first check if the cell is too young. Think of it as a summoning sickness rule. If the cell is too young, it cannot be eaten yet. This helps generate a more visually appealing simulation. If the cell is old enough, though, it is eaten and its age counter resets again.

Every edible check computed does not commit immediately, otherwise we'd have an inconsistent global state. The simulation checks every cell in the grid and then does a second pass, this time just applying the results previously computed. The simulation runs 60 times per second, thus producing the animation.

A technical note: the most popular screen resolution we have nowadays is full HD, i.e., 1920x1080. This means that we'd have around 2 million cells to simulate if we were to render the whole screen. That's too much processing power for a simple Javascript application not making use of WebGL acceleration, so I cheat a little by using a 1:2 scale. Every pixel in my canvas is rendered using 4 pixels on the screen (a 2x2 square).
