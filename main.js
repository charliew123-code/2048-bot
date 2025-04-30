function AI(grid) {
  this.grid = grid;
}

var maxTile = 0;
var moves = 0;
var maxDepth = 1; 
function depth1() {
  maxDepth = 1;
}
function depth2() {
  maxDepth = 2;
}
function depth3() {
  maxDepth = 3;
}
function depth4() {
  maxDepth = 4;
}
function depth5() {
  maxDepth = 5;
}
function depth6() {
  maxDepth = 6;
}

// static evaluation function
AI.prototype.eval = function() {
  var emptyCells = this.grid.availableCells().length;

  // good weights = 0.1, 0, 0, 1, 1
  var smoothWeight = 0.1,
      //monoWeight   = 0.0,
      //islandWeight = 0.0,
      mono2Weight  = 1.0,
      emptyWeight  = 1.0/2.0;

  return this.grid.smoothness() * smoothWeight
       //+ this.grid.monotonicity() * monoWeight
       //- this.grid.islands() * islandWeight
       + this.grid.monotonicity2() * mono2Weight
       + emptyCells * emptyWeight;
};

//AI.prototype.cache = {}

// alpha-beta depth first search
AI.prototype.search = function(depth, alpha, beta, positions, cutoffs) {
  var bestScore;
  var bestMove = -1;
  var result;

  // the maxing player
  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction in [0, 1, 2, 3]) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (2+2==5) {
          return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };
        }
        var newAI = new AI(newGrid);

        if (depth == 0) {
          result = { move: direction, score: newAI.eval() };
        } else {
          result = newAI.search(depth-1, bestScore, beta, positions, cutoffs);
          if (result.score > 9900) { // win
            result.score--; // to slightly penalize higher depth from win
          }
          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }
        if (bestScore > beta) {
          cutoffs++
          return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs };
        }
      }
    }
  }

  else { // computer's turn, we'll do heavy pruning to keep the branching factor low
    bestScore = beta;

    // try a 2 and 4 in each cell and measure how annoying it is
    // with metrics from eval
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };
    for (var value in scores) {
      for (var i in cells) {
        scores[value].push(null);
        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cell);
      }
    }




    /*
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = {2:[], 4:[]};
    var i = 0;
    for (var value in scores) {
      for (var i=0; i<cells.length; i++) {
        scores[value].push(0);
        var cell = cells[i];
        for (var direction in [0,1,2,3]) {
          var vector = this.grid.getVector(direction);
          var target = this.grid.findFarthestPosition(cell, vector);
          if (this.grid.cellOccupied(target.next)) {
            var targetValue = this.grid.cells[target.next.x][target.next.y].value;
            if (targetValue == value) {
              scores[value][i] -= 4;
            } else {
              scores[value][i] += Math.log(value) / Math.log(2);
            }
          }
        }
      }
    }
    //*/

    // now just pick out the most annoying moves
    var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
    for (var value in scores) {
      for (var i=0; i<scores[value].length; i++) {
        if (scores[value][i] == maxScore) {
          candidates.push( { position: cells[i], value: parseInt(value, 10) } );
        }
      }
    }

    // search on each candidate
    for (var i=0; i<candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
      }
    }
    //*/

    /*
    for (var samples=0; samples<4; samples++) {
      var newGrid = this.grid.clone();
      newGrid.computerMove();
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        //console.log('cutoff')
        cutoffs++;
        return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
      }

    }
    //*/
    /*
    for (var x=0; x<4; x++) {
      for (var y=0; y<4; y++) {
        var position = {x:x, y:y};
        if (this.grid.cellAvailable(position)) {
          for (var value in [2, 4]) {
          //for (var value in [2]) {
            var newGrid = this.grid.clone();
            var tile = new Tile(position, value);
            newGrid.insertTile(tile);
            newGrid.playerTurn = true;
            positions++;
            newAI = new AI(newGrid);
            //console.log('inserted tile, players turn is', newGrid.playerTurn);
            result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
            positions = result.positions;
            cutoffs = result.cutoffs;

            if (result.score < bestScore) {
              bestScore = result.score;
            }
            if (bestScore < alpha) {
              //console.log('cutoff')
              cutoffs++;
              return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
            }
          }
        }
      }
    }
    //*/
  }

  return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
}

// performs a search and returns the best move
AI.prototype.getBest = function() {
  return this.iterativeDeep();
}

// performs iterative deepening over the alpha-beta search
AI.prototype.iterativeDeep = function() {
  var start = (new Date()).getTime();
  var depth = 0;
  var best;
  do {
    var newBest = this.search(depth, -10000, 10000, 0 ,0);
    if (newBest.move == -1) {
      //console.log('BREAKING EARLY');
      break;
    } else {
      best = newBest;
    }
    depth++;
  } while (depth < maxDepth);
  //} while ( (new Date()).getTime() - start < minSearchTime);
  //console.log('depth', --depth);
  //console.log(this.translate(best.move));
  //console.log(best);
  return best
}

AI.prototype.translate = function(move) {
 return {
    0: 'up',
    1: 'right',
    2: 'down',
    3: 'left'
  }[move];
}

(function() {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
    window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
      timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}());
animationDelay = 0;
minSearchTime = 0;

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
});
function GameManager(size, InputManager, Actuator) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator     = new Actuator;

  this.running      = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));

  this.inputManager.on('think', function() {
    var best = this.ai.getBest();
  }.bind(this));


  this.inputManager.on('run', function() {
    if (this.running) {
      this.running = false;
      this.actuator.setRunButton('run');
    } else {
      this.running = true;
      this.run()
      this.actuator.setRunButton('stop');
    }
  }.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.restart();
  this.running = false;
  this.actuator.setRunButton('run');
  this.setup();
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid         = new Grid(this.size);
  this.grid.addStartTiles();

  this.ai           = new AI(this.grid);

  this.score        = 0;
  this.over         = false;
  this.won          = false;

  // Update the actuator
  this.actuate();

  // Show User Agent
  document.getElementById('benchmark-user-agent').textContent = navigator.userAgent;
};


// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  this.actuator.actuate(this.grid, {
    score: this.score,
    over:  this.over,
    won:   this.won
  });
};

// makes a given move and updates state
GameManager.prototype.move = function(direction) {
  var result = this.grid.move(direction);
  this.score += result.score;

  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
    elapsedTime = Date.now() - timerStart;
  }

  if (!this.grid.movesAvailable()) {
    this.over = true; // Game over!
  }

  this.actuate();
}

// moves continuously until game is over
GameManager.prototype.run = function() {
  var best = this.ai.getBest();
  this.move(best.move);
  var timeout = animationDelay;
  if (this.running && !this.over && !this.won) {
    var self = this;
    setTimeout(function(){
      self.run();
    }, timeout);
  }
}
Math.seed = Math.random()*233280;

// in order to work 'Math.seed' must NOT be undefined,
// so in any case, you HAVE to provide a Math.seed
Math.seededRandom = function() {
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;

    return rnd;
}

function Grid(size) {
  this.size = size;
  this.startTiles   = 2;

  this.cells = [];

  this.build();
  this.playerTurn = true;
}

// pre-allocate these objects (for speed)
Grid.prototype.indexes = [];
for (var x=0; x<4; x++) {
  Grid.prototype.indexes.push([]);
  for (var y=0; y<4; y++) {
    Grid.prototype.indexes[x].push( {x:x, y:y} );
  }
}

// Build a grid of the specified size
Grid.prototype.build = function () {
  for (var x = 0; x < this.size; x++) {
    var row = this.cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }
};


// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.seededRandom() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];
  var self = this;

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      //cells.push(self.indexes[x][y]);
      cells.push( {x:x, y:y} );
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.clone = function() {
  newGrid = new Grid(this.size);
  newGrid.playerTurn = this.playerTurn;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        newGrid.insertTile(this.cells[x][y].clone());
      }
    }
  }
  return newGrid;
};

// Set up the initial tiles to start the game with
Grid.prototype.addStartTiles = function () {
  for (var i=0; i<this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
Grid.prototype.addRandomTile = function () {
  if (this.cellsAvailable()) {
    var value = Math.seededRandom() < 0.9 ? 2 : 4;
    //var value = Math.random() < 0.9 ? 256 : 512;
    var tile = new Tile(this.randomAvailableCell(), value);

    this.insertTile(tile);
  }
};

// Save all tile positions and remove merger info
Grid.prototype.prepareTiles = function () {
  this.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
Grid.prototype.moveTile = function (tile, cell) {
  this.cells[tile.x][tile.y] = null;
  this.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};


Grid.prototype.vectors = {
  0: { x: 0,  y: -1 }, // up
  1: { x: 1,  y: 0 },  // right
  2: { x: 0,  y: 1 },  // down
  3: { x: -1, y: 0 }   // left
}

// Get the vector representing the chosen direction
Grid.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  return this.vectors[direction];
};

// Move tiles on the grid in the specified direction
// returns true if move was successful
Grid.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var score      = 0;
  var won        = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = self.indexes[x][y];
      tile = self.cellContent(cell);

      if (tile) {
        //if (debug) {
          //console.log('tile @', x, y);
        //}
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.insertTile(merged);
          self.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          score += merged.value;
          
          if (maxTile < merged.value) {
            maxTile = merged.value;
          }
          
          // The mighty 2048 tile
          if (merged.value === 0) {
            won = true;
          }
        } else {
          //if (debug) {
            //console.log(cell);
            //console.log(tile);
          //}
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          self.playerTurn = false;
          //console.log('setting player turn to ', self.playerTurn);
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  //console.log('returning, playerturn is', self.playerTurn);
  //if (!moved) {
    //console.log('cell', cell);
    //console.log('tile', tile);
    //console.log('direction', direction);
    //console.log(this.toString());
  //}
  return {moved: moved, score: score, won: won};
};

Grid.prototype.computerMove = function() {
  moves++;
  this.addRandomTile();
  this.playerTurn = true;
}

// Build a list of positions to traverse in the right order
Grid.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

Grid.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.withinBounds(cell) &&
           this.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

Grid.prototype.movesAvailable = function () {
  return this.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
// returns the number of matches
Grid.prototype.tileMatchesAvailable = function () {
  var self = this;

  //var matches = 0;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; //matches++; // These two tiles can be merged
          }
        }
      }
    }
  }

  //console.log(matches);
  return false; //matches;
};

Grid.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

Grid.prototype.toString = function() {
  string = '';
  for (var i=0; i<4; i++) {
    for (var j=0; j<4; j++) {
      if (this.cells[j][i]) {
        string += this.cells[j][i].value + ' ';
      } else {
        string += '_ ';
      }
    }
    string += '\n';
  }
  return string;
}

// counts the number of isolated groups.
Grid.prototype.islands = function() {
  var self = this;
  var mark = function(x, y, value) {
    if (x >= 0 && x <= 3 && y >= 0 && y <= 3 &&
        self.cells[x][y] &&
        self.cells[x][y].value == value &&
        !self.cells[x][y].marked ) {
      self.cells[x][y].marked = true;

      for (direction in [0,1,2,3]) {
        var vector = self.getVector(direction);
        mark(x + vector.x, y + vector.y, value);
      }
    }
  }

  var islands = 0;

  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (this.cells[x][y]) {
        this.cells[x][y].marked = false
      }
    }
  }
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (this.cells[x][y] &&
          !this.cells[x][y].marked) {
        islands++;
        mark({ x:x, y:y }, this.cells[x][y].value);
      }
    }
  }

  return islands;
}


// measures how smooth the grid is (as if the values of the pieces
// were interpreted as elevations). Sums of the pairwise difference
// between neighboring tiles (in log space, so it represents the
// number of merges that need to happen before they can merge).
// Note that the pieces can be distant
Grid.prototype.smoothness = function() {
  var smoothness = 0;
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if ( this.cellOccupied( this.indexes[x][y] )) {
        var value = Math.log(this.cellContent( this.indexes[x][y] ).value) / Math.log(2);
        for (var direction=1; direction<=2; direction++) {
          var vector = this.getVector(direction);
          var targetCell = this.findFarthestPosition(this.indexes[x][y], vector).next;

          if (this.cellOccupied(targetCell)) {
            var target = this.cellContent(targetCell);
            var targetValue = Math.log(target.value) / Math.log(2);
            smoothness -= Math.abs(value - targetValue);
          }
        }
      }
    }
  }
  return smoothness;
}

Grid.prototype.monotonicity = function() {
  var self = this;
  var marked = [];
  var queued = [];
  var highestValue = 0;
  var highestCell = {x:0, y:0};
  for (var x=0; x<4; x++) {
    marked.push([]);
    queued.push([]);
    for (var y=0; y<4; y++) {
      marked[x].push(false);
      queued[x].push(false);
      if (this.cells[x][y] &&
          this.cells[x][y].value > highestValue) {
        highestValue = this.cells[x][y].value;
        highestCell.x = x;
        highestCell.y = y;
      }
    }
  }

  increases = 0;
  cellQueue = [highestCell];
  queued[highestCell.x][highestCell.y] = true;
  markList = [highestCell];
  markAfter = 1; // only mark after all queued moves are done, as if searching in parallel

  var markAndScore = function(cell) {
    markList.push(cell);
    var value;
    if (self.cellOccupied(cell)) {
      value = Math.log(self.cellContent(cell).value) / Math.log(2);
    } else {
      value = 0;
    }
    for (direction in [0,1,2,3]) {
      var vector = self.getVector(direction);
      var target = { x: cell.x + vector.x, y: cell.y+vector.y }
      if (self.withinBounds(target) && !marked[target.x][target.y]) {
        if ( self.cellOccupied(target) ) {
          targetValue = Math.log(self.cellContent(target).value ) / Math.log(2);
          if ( targetValue > value ) {
            //console.log(cell, value, target, targetValue);
            increases += targetValue - value;
          }
        }
        if (!queued[target.x][target.y]) {
          cellQueue.push(target);
          queued[target.x][target.y] = true;
        }
      }
    }
    if (markAfter == 0) {
      while (markList.length > 0) {
        var cel = markList.pop();
        marked[cel.x][cel.y] = true;
      }
      markAfter = cellQueue.length;
    }
  }

  while (cellQueue.length > 0) {
    markAfter--;
    markAndScore(cellQueue.shift());
  }

  return -increases;
}

Grid.prototype.monotonicity2 = function() {
  var totals = [0, 0, 0, 0];
  for (var x=0; x<4; x++) {
    var current = 0;
    //while ( current<4 && !this.cellOccupied( this.indexes[x][current] )) {
      //current++;
    //}
    var next = current+1;
    while ( next<4 ) {
      while ( next<4 && !this.cellOccupied( this.indexes[x][next] )) {
        next++;
      }
      if (next>=4) { next--; }
      var currentValue = this.cellOccupied({x:x, y:current}) ?
        Math.log(this.cellContent( this.indexes[x][current] ).value) / Math.log(2) :
        0;
      var nextValue = this.cellOccupied({x:x, y:next}) ?
        Math.log(this.cellContent( this.indexes[x][next] ).value) / Math.log(2) :
        0;
      if (currentValue > nextValue) {
        totals[0] += nextValue - currentValue;
      } else if (nextValue > currentValue) {
        totals[1] += currentValue - nextValue;
      }
      current = next;
      next++;
    }
  }

  for (var y=0; y<4; y++) {
    var current = 0;
    //while ( current<4 && !this.cellOccupied( this.indexes[current][y] )) {
      //current++;
    //}
    var next = current+1;
    while ( next<4 ) {
      while ( next<4 && !this.cellOccupied( this.indexes[next][y] )) {
        next++;
      }
      if (next>=4) { next--; }
      var currentValue = this.cellOccupied({x:current, y:y}) ?
        Math.log(this.cellContent( this.indexes[current][y] ).value) / Math.log(2) :
        0;
      var nextValue = this.cellOccupied({x:next, y:y}) ?
        Math.log(this.cellContent( this.indexes[next][y] ).value) / Math.log(2) :
        0;
      if (currentValue > nextValue) {
        totals[2] += nextValue - currentValue;
      } else if (nextValue > currentValue) {
        totals[3] += currentValue - nextValue;
      }
      current = next;
      next++;
    }
  }

  //console.log(totals)
  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
}

// check for win
Grid.prototype.isWin = function() {
  var self = this;
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (self.cellOccupied(this.indexes[x][y])) {
        if (self.cellContent(this.indexes[x][y]).value == 2048) {
          return true;
        }
      }
    }
  }
  return false;
}

//Grid.prototype.zobristTable = {}
//for
//Grid.prototype.hash = function() {
//}
/*! Hammer.JS - v1.0.6 - 2014-01-02
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2014 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

!function(a, b) {
    "use strict";
    function c() {
        d.READY || (d.event.determineEventTypes(),
        d.utils.each(d.gestures, function(a) {
            d.detection.register(a)
        }),
        d.event.onTouch(d.DOCUMENT, d.EVENT_MOVE, d.detection.detect),
        d.event.onTouch(d.DOCUMENT, d.EVENT_END, d.detection.detect),
        d.READY = !0)
    }
    var d = function(a, b) {
        return new d.Instance(a,b || {})
    };
    d.defaults = {
        stop_browser_behavior: {
            userSelect: "none",
            touchAction: "none",
            touchCallout: "none",
            contentZooming: "none",
            userDrag: "none",
            tapHighlightColor: "rgba(0,0,0,0)"
        }
    },
    d.HAS_POINTEREVENTS = a.navigator.pointerEnabled || a.navigator.msPointerEnabled,
    d.HAS_TOUCHEVENTS = "ontouchstart"in a,
    d.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android|silk/i,
    d.NO_MOUSEEVENTS = d.HAS_TOUCHEVENTS && a.navigator.userAgent.match(d.MOBILE_REGEX),
    d.EVENT_TYPES = {},
    d.DIRECTION_DOWN = "down",
    d.DIRECTION_LEFT = "left",
    d.DIRECTION_UP = "up",
    d.DIRECTION_RIGHT = "right",
    d.POINTER_MOUSE = "mouse",
    d.POINTER_TOUCH = "touch",
    d.POINTER_PEN = "pen",
    d.EVENT_START = "start",
    d.EVENT_MOVE = "move",
    d.EVENT_END = "end",
    d.DOCUMENT = a.document,
    d.plugins = d.plugins || {},
    d.gestures = d.gestures || {},
    d.READY = !1,
    d.utils = {
        extend: function(a, c, d) {
            for (var e in c)
                a[e] !== b && d || (a[e] = c[e]);
            return a
        },
        each: function(a, c, d) {
            var e, f;
            if ("forEach"in a)
                a.forEach(c, d);
            else if (a.length !== b) {
                for (e = 0,
                f = a.length; f > e; e++)
                    if (c.call(d, a[e], e, a) === !1)
                        return
            } else
                for (e in a)
                    if (a.hasOwnProperty(e) && c.call(d, a[e], e, a) === !1)
                        return
        },
        hasParent: function(a, b) {
            for (; a; ) {
                if (a == b)
                    return !0;
                a = a.parentNode
            }
            return !1
        },
        getCenter: function(a) {
            var b = []
              , c = [];
            return d.utils.each(a, function(a) {
                b.push("undefined" != typeof a.clientX ? a.clientX : a.pageX),
                c.push("undefined" != typeof a.clientY ? a.clientY : a.pageY)
            }),
            {
                pageX: (Math.min.apply(Math, b) + Math.max.apply(Math, b)) / 2,
                pageY: (Math.min.apply(Math, c) + Math.max.apply(Math, c)) / 2
            }
        },
        getVelocity: function(a, b, c) {
            return {
                x: Math.abs(b / a) || 0,
                y: Math.abs(c / a) || 0
            }
        },
        getAngle: function(a, b) {
            var c = b.pageY - a.pageY
              , d = b.pageX - a.pageX;
            return 180 * Math.atan2(c, d) / Math.PI
        },
        getDirection: function(a, b) {
            var c = Math.abs(a.pageX - b.pageX)
              , e = Math.abs(a.pageY - b.pageY);
            return c >= e ? a.pageX - b.pageX > 0 ? d.DIRECTION_LEFT : d.DIRECTION_RIGHT : a.pageY - b.pageY > 0 ? d.DIRECTION_UP : d.DIRECTION_DOWN
        },
        getDistance: function(a, b) {
            var c = b.pageX - a.pageX
              , d = b.pageY - a.pageY;
            return Math.sqrt(c * c + d * d)
        },
        getScale: function(a, b) {
            return a.length >= 2 && b.length >= 2 ? this.getDistance(b[0], b[1]) / this.getDistance(a[0], a[1]) : 1
        },
        getRotation: function(a, b) {
            return a.length >= 2 && b.length >= 2 ? this.getAngle(b[1], b[0]) - this.getAngle(a[1], a[0]) : 0
        },
        isVertical: function(a) {
            return a == d.DIRECTION_UP || a == d.DIRECTION_DOWN
        },
        stopDefaultBrowserBehavior: function(a, b) {
            b && a && a.style && (d.utils.each(["webkit", "khtml", "moz", "Moz", "ms", "o", ""], function(c) {
                d.utils.each(b, function(b) {
                    c && (b = c + b.substring(0, 1).toUpperCase() + b.substring(1)),
                    b in a.style && (a.style[b] = b)
                })
            }),
            "none" == b.userSelect && (a.onselectstart = function() {
                return !1
            }
            ),
            "none" == b.userDrag && (a.ondragstart = function() {
                return !1
            }
            ))
        }
    },
    d.Instance = function(a, b) {
        var e = this;
        return c(),
        this.element = a,
        this.enabled = !0,
        this.options = d.utils.extend(d.utils.extend({}, d.defaults), b || {}),
        this.options.stop_browser_behavior && d.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior),
        d.event.onTouch(a, d.EVENT_START, function(a) {
            e.enabled && d.detection.startDetect(e, a)
        }),
        this
    }
    ,
    d.Instance.prototype = {
        on: function(a, b) {
            var c = a.split(" ");
            return d.utils.each(c, function(a) {
                this.element.addEventListener(a, b, !1)
            }, this),
            this
        },
        off: function(a, b) {
            var c = a.split(" ");
            return d.utils.each(c, function(a) {
                this.element.removeEventListener(a, b, !1)
            }, this),
            this
        },
        trigger: function(a, b) {
            b || (b = {});
            var c = d.DOCUMENT.createEvent("Event");
            c.initEvent(a, !0, !0),
            c.gesture = b;
            var e = this.element;
            return d.utils.hasParent(b.target, e) && (e = b.target),
            e.dispatchEvent(c),
            this
        },
        enable: function(a) {
            return this.enabled = a,
            this
        }
    };
    var e = null
      , f = !1
      , g = !1;
    d.event = {
        bindDom: function(a, b, c) {
            var e = b.split(" ");
            d.utils.each(e, function(b) {
                a.addEventListener(b, c, !1)
            })
        },
        onTouch: function(a, b, c) {
            var h = this;
            this.bindDom(a, d.EVENT_TYPES[b], function(i) {
                var j = i.type.toLowerCase();
                if (!j.match(/mouse/) || !g) {
                    j.match(/touch/) || j.match(/pointerdown/) || j.match(/mouse/) && 1 === i.which ? f = !0 : j.match(/mouse/) && !i.which && (f = !1),
                    j.match(/touch|pointer/) && (g = !0);
                    var k = 0;
                    f && (d.HAS_POINTEREVENTS && b != d.EVENT_END ? k = d.PointerEvent.updatePointer(b, i) : j.match(/touch/) ? k = i.touches.length : g || (k = j.match(/up/) ? 0 : 1),
                    k > 0 && b == d.EVENT_END ? b = d.EVENT_MOVE : k || (b = d.EVENT_END),
                    (k || null === e) && (e = i),
                    c.call(d.detection, h.collectEventData(a, b, h.getTouchList(e, b), i)),
                    d.HAS_POINTEREVENTS && b == d.EVENT_END && (k = d.PointerEvent.updatePointer(b, i))),
                    k || (e = null,
                    f = !1,
                    g = !1,
                    d.PointerEvent.reset())
                }
            })
        },
        determineEventTypes: function() {
            var a;
            a = d.HAS_POINTEREVENTS ? d.PointerEvent.getEvents() : d.NO_MOUSEEVENTS ? ["touchstart", "touchmove", "touchend touchcancel"] : ["touchstart mousedown", "touchmove mousemove", "touchend touchcancel mouseup"],
            d.EVENT_TYPES[d.EVENT_START] = a[0],
            d.EVENT_TYPES[d.EVENT_MOVE] = a[1],
            d.EVENT_TYPES[d.EVENT_END] = a[2]
        },
        getTouchList: function(a) {
            return d.HAS_POINTEREVENTS ? d.PointerEvent.getTouchList() : a.touches ? a.touches : (a.identifier = 1,
            [a])
        },
        collectEventData: function(a, b, c, e) {
            var f = d.POINTER_TOUCH;
            return (e.type.match(/mouse/) || d.PointerEvent.matchType(d.POINTER_MOUSE, e)) && (f = d.POINTER_MOUSE),
            {
                center: d.utils.getCenter(c),
                timeStamp: (new Date).getTime(),
                target: e.target,
                touches: c,
                eventType: b,
                pointerType: f,
                srcEvent: e,
                preventDefault: function() {
                    this.srcEvent.preventManipulation && this.srcEvent.preventManipulation(),
                    this.srcEvent.preventDefault && this.srcEvent.preventDefault()
                },
                stopPropagation: function() {
                    this.srcEvent.stopPropagation()
                },
                stopDetect: function() {
                    return d.detection.stopDetect()
                }
            }
        }
    },
    d.PointerEvent = {
        pointers: {},
        getTouchList: function() {
            var a = this
              , b = [];
            return d.utils.each(a.pointers, function(a) {
                b.push(a)
            }),
            b
        },
        updatePointer: function(a, b) {
            return a == d.EVENT_END ? this.pointers = {} : (b.identifier = b.pointerId,
            this.pointers[b.pointerId] = b),
            Object.keys(this.pointers).length
        },
        matchType: function(a, b) {
            if (!b.pointerType)
                return !1;
            var c = b.pointerType
              , e = {};
            return e[d.POINTER_MOUSE] = c === b.MSPOINTER_TYPE_MOUSE || c === d.POINTER_MOUSE,
            e[d.POINTER_TOUCH] = c === b.MSPOINTER_TYPE_TOUCH || c === d.POINTER_TOUCH,
            e[d.POINTER_PEN] = c === b.MSPOINTER_TYPE_PEN || c === d.POINTER_PEN,
            e[a]
        },
        getEvents: function() {
            return ["pointerdown MSPointerDown", "pointermove MSPointerMove", "pointerup pointercancel MSPointerUp MSPointerCancel"]
        },
        reset: function() {
            this.pointers = {}
        }
    },
    d.detection = {
        gestures: [],
        current: null,
        previous: null,
        stopped: !1,
        startDetect: function(a, b) {
            this.current || (this.stopped = !1,
            this.current = {
                inst: a,
                startEvent: d.utils.extend({}, b),
                lastEvent: !1,
                name: ""
            },
            this.detect(b))
        },
        detect: function(a) {
            if (this.current && !this.stopped) {
                a = this.extendEventData(a);
                var b = this.current.inst.options;
                return d.utils.each(this.gestures, function(c) {
                    return this.stopped || b[c.name] === !1 || c.handler.call(c, a, this.current.inst) !== !1 ? void 0 : (this.stopDetect(),
                    !1)
                }, this),
                this.current && (this.current.lastEvent = a),
                a.eventType == d.EVENT_END && !a.touches.length - 1 && this.stopDetect(),
                a
            }
        },
        stopDetect: function() {
            this.previous = d.utils.extend({}, this.current),
            this.current = null,
            this.stopped = !0
        },
        extendEventData: function(a) {
            var b = this.current.startEvent;
            !b || a.touches.length == b.touches.length && a.touches !== b.touches || (b.touches = [],
            d.utils.each(a.touches, function(a) {
                b.touches.push(d.utils.extend({}, a))
            }));
            var c, e, f = a.timeStamp - b.timeStamp, g = a.center.pageX - b.center.pageX, h = a.center.pageY - b.center.pageY, i = d.utils.getVelocity(f, g, h);
            return "end" === a.eventType ? (c = this.current.lastEvent && this.current.lastEvent.interimAngle,
            e = this.current.lastEvent && this.current.lastEvent.interimDirection) : (c = this.current.lastEvent && d.utils.getAngle(this.current.lastEvent.center, a.center),
            e = this.current.lastEvent && d.utils.getDirection(this.current.lastEvent.center, a.center)),
            d.utils.extend(a, {
                deltaTime: f,
                deltaX: g,
                deltaY: h,
                velocityX: i.x,
                velocityY: i.y,
                distance: d.utils.getDistance(b.center, a.center),
                angle: d.utils.getAngle(b.center, a.center),
                interimAngle: c,
                direction: d.utils.getDirection(b.center, a.center),
                interimDirection: e,
                scale: d.utils.getScale(b.touches, a.touches),
                rotation: d.utils.getRotation(b.touches, a.touches),
                startEvent: b
            }),
            a
        },
        register: function(a) {
            var c = a.defaults || {};
            return c[a.name] === b && (c[a.name] = !0),
            d.utils.extend(d.defaults, c, !0),
            a.index = a.index || 1e3,
            this.gestures.push(a),
            this.gestures.sort(function(a, b) {
                return a.index < b.index ? -1 : a.index > b.index ? 1 : 0
            }),
            this.gestures
        }
    },
    d.gestures.Drag = {
        name: "drag",
        index: 50,
        defaults: {
            drag_min_distance: 10,
            correct_for_drag_min_distance: !0,
            drag_max_touches: 1,
            drag_block_horizontal: !1,
            drag_block_vertical: !1,
            drag_lock_to_axis: !1,
            drag_lock_min_distance: 25
        },
        triggered: !1,
        handler: function(a, b) {
            if (d.detection.current.name != this.name && this.triggered)
                return b.trigger(this.name + "end", a),
                this.triggered = !1,
                void 0;
            if (!(b.options.drag_max_touches > 0 && a.touches.length > b.options.drag_max_touches))
                switch (a.eventType) {
                case d.EVENT_START:
                    this.triggered = !1;
                    break;
                case d.EVENT_MOVE:
                    if (a.distance < b.options.drag_min_distance && d.detection.current.name != this.name)
                        return;
                    if (d.detection.current.name != this.name && (d.detection.current.name = this.name,
                    b.options.correct_for_drag_min_distance && a.distance > 0)) {
                        var c = Math.abs(b.options.drag_min_distance / a.distance);
                        d.detection.current.startEvent.center.pageX += a.deltaX * c,
                        d.detection.current.startEvent.center.pageY += a.deltaY * c,
                        a = d.detection.extendEventData(a)
                    }
                    (d.detection.current.lastEvent.drag_locked_to_axis || b.options.drag_lock_to_axis && b.options.drag_lock_min_distance <= a.distance) && (a.drag_locked_to_axis = !0);
                    var e = d.detection.current.lastEvent.direction;
                    a.drag_locked_to_axis && e !== a.direction && (a.direction = d.utils.isVertical(e) ? a.deltaY < 0 ? d.DIRECTION_UP : d.DIRECTION_DOWN : a.deltaX < 0 ? d.DIRECTION_LEFT : d.DIRECTION_RIGHT),
                    this.triggered || (b.trigger(this.name + "start", a),
                    this.triggered = !0),
                    b.trigger(this.name, a),
                    b.trigger(this.name + a.direction, a),
                    (b.options.drag_block_vertical && d.utils.isVertical(a.direction) || b.options.drag_block_horizontal && !d.utils.isVertical(a.direction)) && a.preventDefault();
                    break;
                case d.EVENT_END:
                    this.triggered && b.trigger(this.name + "end", a),
                    this.triggered = !1
                }
        }
    },
    d.gestures.Hold = {
        name: "hold",
        index: 10,
        defaults: {
            hold_timeout: 500,
            hold_threshold: 1
        },
        timer: null,
        handler: function(a, b) {
            switch (a.eventType) {
            case d.EVENT_START:
                clearTimeout(this.timer),
                d.detection.current.name = this.name,
                this.timer = setTimeout(function() {
                    "hold" == d.detection.current.name && b.trigger("hold", a)
                }, b.options.hold_timeout);
                break;
            case d.EVENT_MOVE:
                a.distance > b.options.hold_threshold && clearTimeout(this.timer);
                break;
            case d.EVENT_END:
                clearTimeout(this.timer)
            }
        }
    },
    d.gestures.Release = {
        name: "release",
        index: 1 / 0,
        handler: function(a, b) {
            a.eventType == d.EVENT_END && b.trigger(this.name, a)
        }
    },
    d.gestures.Swipe = {
        name: "swipe",
        index: 40,
        defaults: {
            swipe_min_touches: 1,
            swipe_max_touches: 1,
            swipe_velocity: .7
        },
        handler: function(a, b) {
            if (a.eventType == d.EVENT_END) {
                if (b.options.swipe_max_touches > 0 && a.touches.length < b.options.swipe_min_touches && a.touches.length > b.options.swipe_max_touches)
                    return;
                (a.velocityX > b.options.swipe_velocity || a.velocityY > b.options.swipe_velocity) && (b.trigger(this.name, a),
                b.trigger(this.name + a.direction, a))
            }
        }
    },
    d.gestures.Tap = {
        name: "tap",
        index: 100,
        defaults: {
            tap_max_touchtime: 250,
            tap_max_distance: 10,
            tap_always: !0,
            doubletap_distance: 20,
            doubletap_interval: 300
        },
        handler: function(a, b) {
            if (a.eventType == d.EVENT_END && "touchcancel" != a.srcEvent.type) {
                var c = d.detection.previous
                  , e = !1;
                if (a.deltaTime > b.options.tap_max_touchtime || a.distance > b.options.tap_max_distance)
                    return;
                c && "tap" == c.name && a.timeStamp - c.lastEvent.timeStamp < b.options.doubletap_interval && a.distance < b.options.doubletap_distance && (b.trigger("doubletap", a),
                e = !0),
                (!e || b.options.tap_always) && (d.detection.current.name = "tap",
                b.trigger(d.detection.current.name, a))
            }
        }
    },
    d.gestures.Touch = {
        name: "touch",
        index: -1 / 0,
        defaults: {
            prevent_default: !1,
            prevent_mouseevents: !1
        },
        handler: function(a, b) {
            return b.options.prevent_mouseevents && a.pointerType == d.POINTER_MOUSE ? (a.stopDetect(),
            void 0) : (b.options.prevent_default && a.preventDefault(),
            a.eventType == d.EVENT_START && b.trigger(this.name, a),
            void 0)
        }
    },
    d.gestures.Transform = {
        name: "transform",
        index: 45,
        defaults: {
            transform_min_scale: .01,
            transform_min_rotation: 1,
            transform_always_block: !1
        },
        triggered: !1,
        handler: function(a, b) {
            if (d.detection.current.name != this.name && this.triggered)
                return b.trigger(this.name + "end", a),
                this.triggered = !1,
                void 0;
            if (!(a.touches.length < 2))
                switch (b.options.transform_always_block && a.preventDefault(),
                a.eventType) {
                case d.EVENT_START:
                    this.triggered = !1;
                    break;
                case d.EVENT_MOVE:
                    var c = Math.abs(1 - a.scale)
                      , e = Math.abs(a.rotation);
                    if (c < b.options.transform_min_scale && e < b.options.transform_min_rotation)
                        return;
                    d.detection.current.name = this.name,
                    this.triggered || (b.trigger(this.name + "start", a),
                    this.triggered = !0),
                    b.trigger(this.name, a),
                    e > b.options.transform_min_rotation && b.trigger("rotate", a),
                    c > b.options.transform_min_scale && (b.trigger("pinch", a),
                    b.trigger("pinch" + (a.scale < 1 ? "in" : "out"), a));
                    break;
                case d.EVENT_END:
                    this.triggered && b.trigger(this.name + "end", a),
                    this.triggered = !1
                }
        }
    },
    "function" == typeof define && "object" == typeof define.amd && define.amd ? define(function() {
        return d
    }) : "object" == typeof module && "object" == typeof module.exports ? module.exports = d : a.Hammer = d
}(this);
//# sourceMappingURL=hammer.min.map
function HTMLActuator() {
  this.tileContainer    = document.getElementsByClassName("tile-container")[0];
  this.scoreContainer   = document.getElementsByClassName("score-container")[0];
  this.messageContainer = document.getElementsByClassName("game-message")[0];
  this.sharingContainer = document.getElementsByClassName("score-sharing")[0];
  this.benchmarkResults = document.getElementById("benchmark-results");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);

    if (metadata.over) self.message(false); // You lose
    if (metadata.won) self.message(true); // You win!
  });
};

HTMLActuator.prototype.restart = function () {
  if (ga) ga("send", "event", "game", "restart");
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var element   = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];
  this.applyClasses(element, classes);

  element.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(element, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(element, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(element, classes);
  }

  // Put the tile on the board
  this.tileContainer.appendChild(element);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? elapsedTime + " ms" : "Game Over | Max Tile: " + maxTile + " | Moves Taken: " + moves;

  // if (ga) ga("send", "event", "game", "end", type, this.score);

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won", "game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.textContent = "Tweet";

  var text = "My browser scored " + elapsedTime + " ms at 2048! #2048game #2048bench";
  tweet.setAttribute("data-text", text);
  this.benchmarkResults.innerHTML = 'Elapsed time: <b>' + elapsedTime + ' ms</b>';
  if (ga) ga('send', 'event', 'Benchmark', navigator.userAgent, elapsedTime)
  return tweet;
};


HTMLActuator.prototype.setRunButton = function(message) {
  document.getElementById('run-button').innerHTML = document.getElementById('run-button').getAttribute('data-text-' + message);
}
function KeyboardInputManager() {
  this.events = {};

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // vim keybindings
    76: 1,
    74: 2,
    72: 3
  };

  var runButton = document.getElementById('run-button');
  runButton.addEventListener('click', function(e) {
    e.preventDefault();
    timerStart = new Date()
    self.emit('run')
  })
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};
function Tile(position, value) {
  this.x                = position.x;
  this.y                = position.y;
  this.value            = value || 2;

  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

Tile.prototype.clone = function() {
  newTile = new Tile({ x: this.x, y: this.y }, this.value);
  //newTile.previousPosition = { x: this.previousPosition.x, y: this.previousPosition.y };
  //newTile.mergedFrom = { x: this.previousPosition.x, y: this.previousPosition.y };
  return newTile;
}
