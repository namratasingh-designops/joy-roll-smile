/** Short spoken/captioned lines. Every line is 6 words or fewer. */

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)] ?? "";

export const LINES = {
  welcome: ["Hello friend! Let's play Ludo!", "Hi! I'm Leo. Let's play!", "Welcome back! Ready to play?"],
  yourTurn: ["Your turn! Tap the dice!", "It's your turn! Tap the dice!", "Your go! Tap the big dice!"],
  tapDiceHint: ["Tap the big dice!", "Give the dice a tap!", "Tap here to roll!"],
  rolled: (n: number) => [`You rolled a ${n}!`, `A ${n}! Nice roll!`, `${n}! Great rolling!`],
  buddyRolled: (name: string, n: number) => [`${name} rolled a ${n}.`, `${name} got a ${n}.`],
  chooseToken: ["Tap a glowing token!", "Pick a glowing token!", "Choose a token to move!"],
  noMoves: ["No moves this time. That's okay!", "No move now. You're doing great!", "Nothing to move. Next turn!"],
  lucky: ["Lucky roll! Out you come!", "Lucky roll! Off we go!"],
  safe: ["Safe spot!", "Nice and safe!", "Star square! Safe!"],
  homeToken: ["Home sweet home!", "That one is home!", "Yay! Home already!"],
  bump: ["Whoops! Back home for a bounce!", "Boing! Back to base!", "Oopsie! Back home you go!"],
  bumped: ["You can do it!", "Try again, superstar!", "That's okay! Keep going!"],
  turnOf: (name: string) => [`${name}'s turn!`, `Now it's ${name}!`],
  goodMove: ["Great counting!", "Nice choice!", "Super move!"],
  sixCheer: ["A six! Roll again!", "Six! One more roll!"],
  win: ["You did it, superstar!", "Hooray! You did it!", "Amazing! Great playing!"],
  buddyWin: (name: string) => [`${name} is home! Well played!`, `${name} finished. Great try!`],
  breakTime: ["Let's stretch together!", "Time to wiggle and stretch!"],
  passDevice: (name: string) => [`Pass it to ${name}!`, `${name}, your turn next!`],
  colorPicked: (name: string) => [`${name}! Good choice!`, `You are ${name}!`],
  countWords: ["One", "Two", "Three", "Four", "Five", "Six"],
};

export function line(lines: string[]): string {
  return pick(lines) ?? "";
}
