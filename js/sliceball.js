// A few global variables. Inexcusable in any language but JavaScript.

// "constants"
var HORIZONTAL = 0;
var VERTICAL = 1;

// These are all initialized in the init() function
var canvas;
var ctx;
var w;
var h;
var direction;
var occupied;
var all_rectangles;
var closed_rectangles;
var all_balls;
var last_balls;
var unfinished_wall;
var stopped;
var information;
var paused;
var stuckcounter;

var wall_audio;
var bounce_audio;
var rectangle_audio;
var explode_audio;
var win_audio;
var background_music;
var youwon_music;
var gameover_music;

var clickcounter;
var starttime;
var gamestart;

var target_coverage;

var innerloop;
var infoloop;

var levels;

var infotext;
var titletext;
var pause_button;
var resume_button;

var current_level;

var deadline;

var audio;

var level_up_animation;
var game_over_animation;
var gameovertime;

// Mark the given coordinates as occupied.
function set_occupied(x, y) {
  occupied[x + y * w] = true;
}

// Mark the given rectangle as occupied
function mark_occupied(x, y, width, height) {
  for (var ypos = y; ypos < y + height; ypos++) {
    for (var xpos = x; xpos < x + width; xpos++) {
      occupied[xpos + ypos * w] = true;
    }
  }
}

// Split all rectangles it applies to along the given y coordinate
function horizontal_split(xpos, ypos) {
  var newrects = [];
  for (var i=0; i < all_rectangles.length; i++) {
    var rect = all_rectangles[i];
    if ((rect[1] < ypos) && (rect[1]+rect[3] > ypos) && (rect[0] < xpos) && (rect[0]+rect[2] > xpos)) {
      var rect_a = [rect[0], rect[1], rect[2], ypos - rect[1]];
      var rect_b = [rect[0], ypos + 1, rect[2], rect[3] - (ypos - rect[1])];

      var thickness = 4;
      // A horizontal wall line is drawn at ypos
      var rect_between = [rect[0], ypos - (thickness / 2), rect[2], thickness];
      mark_occupied(rect_between[0], rect_between[1], rect_between[2], rect_between[3]);

      newrects.push(rect_a);
      newrects.push(rect_b);
      rectangle_audio.currentTime = 0;
      rectangle_audio.play();
    } else {
      newrects.push(rect);
    }
  }
  all_rectangles = newrects.slice();
}

// Split all rectangles it applies to along the given x coordinate
function vertical_split(xpos, ypos) {
  var newrects = [];
  for (var i=0; i < all_rectangles.length; i++) {
    var rect = all_rectangles[i];
    if ((rect[0] < xpos) && (rect[0]+rect[2] > xpos) && (rect[1] < ypos) && (rect[1]+rect[3] > ypos)) {
      var rect_a = [rect[0], rect[1], xpos - rect[0], rect[3]];
      var rect_b = [xpos + 1, rect[1], rect[2] - (xpos - rect[0]), rect[3]];

      var thickness = 4;
      // A vertical wall line is drawn at xpos
      var rect_between = [xpos - (thickness / 2), rect[1], thickness, rect[3]];
      mark_occupied(rect_between[0], rect_between[1], rect_between[2], rect_between[3]);

      newrects.push(rect_a);
      newrects.push(rect_b);
      rectangle_audio.currentTime = 0;
      rectangle_audio.play();
    } else {
      newrects.push(rect);
    }
  }
  all_rectangles = newrects.slice();
}

// Check if the given coordinates are already occupied.
function is_occupied(x, y) {
  return (x + y * w) in occupied
}

// Draw a square at x, y with width sw and height sh.
// sideffect: marks the given coordinates as occupied
function square(x, y, sw, sh) {
  ctx.beginPath();
  ctx.rect(x, y, sw, sh);
  ctx.fill();
  ctx.closePath();
  set_occupied(x, y);
}

// Draw all the occupied coordinates in white.
function draw_occupied() {
  for (var key in occupied) {
    var xpos = key % w;
    var ypos = (key - xpos) / w;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.rect(xpos, ypos, 4, 4);
    ctx.fill();
    ctx.closePath();
  }
}

// Checks if a rectangle contains a ball
function has_ball(rect) {
  for (var i=0; i < all_balls.length; i++) {
    var ball = all_balls[i];
    if ((ball[0] > rect[0]) && (ball[0] <= (rect[0]+rect[2])) && (ball[1] > rect[1]) && (ball[1] <= (rect[1]+rect[3]))) {
      return true;
    }
  }
  return false;
}

// Check is the given coordinates is at a ball
function is_at_ball(xpos, ypos) {
  for (var i=0; i < all_balls.length; i++) {
    var ball = all_balls[i];
    if ((ball[0] == xpos) && (ball[1] == ypos)) {
      return true;
    }
  }
  return false;
}

function draw_balls() {
  for (var i=0; i < all_balls.length; i++) {
    var ball = all_balls[i];
    // Draw a ball
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(ball[0], ball[1], 5, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
  }
}

// Check if the given rectangle contains the given x and y position
function has(rect, xpos, ypos) {
  return ((rect[1] < ypos) && (rect[1]+rect[3] >= ypos) && (rect[0] < xpos) && (rect[0]+rect[2] >= xpos));
}

// TODO: If a ball has not moved for a while, remove it and duplicate
// one of the existing balls, but with a new acceleration vector
function stuck_ball_detector(max_stuck_count) {
  for (var i=0; i < last_balls.length; i++) {
    var last_ball = last_balls[i];
    var ball = all_balls[i];
    if ((ball[0] == last_ball[0]) && (ball[1] == last_ball[1])) {
      stuckcounter++;
      if (stuckcounter > max_stuck_count) {
        //alert("stuck ball!");
        var dupliindex = rand(all_balls.length);
        all_balls[i][0] = all_balls[dupliindex][0];
        all_balls[i][1] = all_balls[dupliindex][1];
        all_balls[i][2] = rand(10)+2;
        all_balls[i][3] = rand(10)+2;
        stuckcounter = 0;
      }
    }
  }
  // store the balls for later checks
  last_balls = [];
  for (var i=0; i < all_balls.length; i++) {
    var ball = all_balls[i];
    last_balls.push(ball.slice());
  }
}

function draw_level_up() {
  //clear_everything();
  var msg = "Level up!";
  ctx.fillStyle = "black";
  ctx.clearRect(0, (h-200)/2, w, 100);
  ctx.fillStyle = "white";
  ctx.font = "bold 46px sans-serif";
  // TODO: 400x100 is an approximation of the size of the text, calculate exactly instead
  ctx.fillText(msg, (w-400)/2, (h-100)/2);
}

function level_up_happening() {
  draw_level_up();
  level_up_animation = setInterval(draw_level_up_animation, 30);
}

function draw_level_up_animation() {
  // TODO: Draw something spinning
  var t = new Date().getTime()/100.0;
  var x = Math.cos(t)*(w/3.0) + (w/2.0);
  var y = Math.sin(t)*(h/3.0) + (h/2.0);
  clear_everything();
  draw_level_up();
  ctx.fillStyle = "yellow";
  var msg = levels[current_level-1][2];
  ctx.fillText(msg, x, y);
}

function draw_game_over(y) {
  var msg = "Game over";
  ctx.fillStyle = "black";
  ctx.clearRect(0, y, w, 100);
  ctx.fillStyle = "orange";
  ctx.font = "bold 60px sans-serif";
  // TODO: 400x100 is an approximation of the size of the text, calculate exactly instead
  ctx.fillText(msg, (w-400)/2, y);
}

function game_over_happening() {
  var y = (h-200)/2;
  draw_game_over(y);

  gameovertime = new Date().getTime();
  game_over_animation = setInterval(draw_game_over_animation, 20);
}

function draw_game_over_animation() {
  var y = (h-200)/2;
  var t = (new Date().getTime() - gameovertime)/20;
  if ((y+t) < h) {
      // draw the "Game over" text one step further down at a time
      draw_game_over(y+t);
  } else {
    // stop the animation once the text has reached the bottom (and a bit further than that)
    clearInterval(game_over_animation);
  }
}

function bounce_sound() {
//  Was a bit too much with this much noise
//  bounce_audio.currentTime = 0;
//  bounce_audio.play();
}

function game_over() {
  stopped = true;
  clearInterval(innerloop);

  if (audio) {
    explode_audio.currentTime = 0;
    explode_audio.play();
    background_music.pause();
    background_music.currentTime = 0;
    gameover_music.currentTime = 0;
    gameover_music.play();
  }

  clearInterval(infoloop);

  pause_button.disabled = true;

  game_over_happening();

  // Start a new game in 2 seconds!
  //setTimeout(new_game, 2000);
}

function move_balls() {
  var wallbounce = false;
  // a ball is [xpos, ypos, xacceleration, yacceleration]
  for (var i=0; i < all_balls.length; i++) {
    var ball = all_balls[i];
    ball[0] += ball[2];
    ball[1] += ball[3];
    if (ball[0] < 0) {
      ball[0] = 0;
      ball[2] *= -1;
      bounce_sound();
      wallbounce = true;
    } else if (ball[0] >= w) {
      ball[0] = w;
      ball[2] *= -1;
      bounce_sound();
      wallbounce = true;
    }
    if (ball[1] < 0) {
      ball[1] = 0;
      ball[3] *= -1;
      bounce_sound();
      wallbounce = true;
    } else if (ball[1] >= h) {
      ball[1] = h;
      ball[3] *= -1;
      bounce_sound();
      wallbounce = true;
    }
    // TODO: Use the occupied places as rectangles to bounce against instead of the closed rectangles
    for (var i2=0; i2 < closed_rectangles.length; i2++) {
      var rect = closed_rectangles[i2];
      // TODO: Turn the rection based on if x or y is hit instead of has()
      //if (has(rect, ball[0], ball[1])) {
      //if (is_occupied(ball[0], ball[1]) ||
      if (has(rect, ball[0], ball[1])) {
        ball[0] -= ball[2];
        ball[1] -= ball[3];
        if (ball[0] > rect[0] && ball[0] <= rect[0]+rect[2]) {
          ball[3] *= -1;
          bounce_sound();
        }
        if (ball[1] > rect[1] && ball[1] <= rect[1]+rect[3]) {
          ball[2] *= -1;
          bounce_sound();
        }
      }
    }
    for (var i3=0; i3 < unfinished_wall.length; i3++) {
      var pos = unfinished_wall[i3];
      if ((ball[0] == pos[0]) && (ball[1] == pos[1])) {
        game_over();
        return;
      }
    }
  }
}

function clear_everything() {
  ctx.fillStyle = "black";
  ctx.clearRect(0, 0, w, h);
}

function draw_information() {
  ctx.fillStyle = "black";
  ctx.clearRect(0, 0, w, 30);
  ctx.fillStyle = "white";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(information, 20, 20);
}

function set_pause_stats() {
  // Game information
  if (!stopped) {
    information = (percentage_covered()*100).toFixed(2) + "% coverage, " + clickcounter + " clicks.";
  }
}

function time_left() {
  return deadline - new Date().getTime();
}

function level_info() {
  if (stopped) {
    infotext.intterHTML = "";
    return;
  }

  var need_coverage = ((target_coverage - percentage_covered())*100).toFixed(2);
  var seconds_left = (time_left() / 1000).toFixed(0);

  if (seconds_left <= 0) {
    seconds_left = 0;
  }

  var msg = "";
  msg += "Level " + current_level + ". ";
  msg += "Need " + need_coverage + "% more coverage. ";
  msg += seconds_left + " seconds left.";
  infotext.innerHTML = msg;

  // Blink the title and info text if there is equal to or less than 5 seconds left
  if (seconds_left <= 5) {
    // Alternate the colors
    if (titletext.style.color != "#ff0000") {
      titletext.style.color = "#00ff00";
    } else {
      titletext.style.color = "#ff0000";
    }
    // Alternate the colors
    if (infotext.style.color != "#dd0000") {
      infotext.style.color = "#00dd00";
    } else {
      infotext.style.color = "#dd0000";
    }
  }
}

function next_level() {
  // Stop the level up animation, if running
  clearInterval(level_up_animation);

  if ((current_level-1) >= levels.length) {
    // the game is won
    return;
  }
  init(current_level + 1);
}

function you_won_happening() {
  //clear_everything();

  var seconds_passed = (new Date().getTime() - gamestart) / 1000;
  var points = ((seconds_passed / clickcounter)*100).toFixed(0);
  infotext.innerHTML = "You won with " + points + " points in " + seconds_passed + " seconds with " + clickcounter + " clicks!";

  var msg = "You won! ^^";

  ctx.fillStyle = "black";
  ctx.clearRect(0, (h-200)/2, w, 100);
  ctx.fillStyle = "white";
  ctx.font = "bold 46px sans-serif";
  // TODO: 400x100 is an approximation of the size of the text, calculate exactly instead
  ctx.fillText(msg, (w-400)/2, (h-100)/2);
}

function register_highscore_if_good_enough() {
  // TODO: Check if the points are good enough with the highscore server.
  //       If they are, ask for a name, then register name and points with the server.
  alert("Your name?");
}

function every_loop() {
  if (stopped) {
    draw_information();
    return;
  }

  // Movement
  move_balls();

  if (stopped) {
    return;
  }

  stuck_ball_detector(5);

  // Game logic
  set_pause_stats();

  if (percentage_covered() > target_coverage) {
    clearInterval(innerloop);
    stopped = true;
    // Stop the background music and play a sound
    if (audio) {
      background_music.pause();
      background_music.currentTime = 0;
      win_audio.currentTime = 0;
      win_audio.play();
    }

    // Check if the level, after level up, will be the last level. In which case we have a winner.
    if (current_level >= levels.length) {
      if (audio) {
        youwon_music.currentTime = 0;
        youwon_music.play();
      }

      // Register the highscore, if good enough
      setTimeout(register_highscore_if_good_enough, 2000);

      clearInterval(infoloop);

      // Show the winning screen
      you_won_happening();
    } else {
      // Start the next level in two seconds.
      setTimeout(next_level, 2000);

      // Show the level-up screen
      level_up_happening();
    }
    return;
  }

  // Drawing
  clear_everything();
  draw_and_close_rectangles();
  draw_balls();
}

// tries to find suitable colors based on the given index
function mondrian_color_from_index(i) {
  if (i % 9 == 0) {
    return "brown";
  }
  if (i % 7 == 0) {
    return "white";
  }
  if (i % 5 == 0) {
    return "yellow";
  }
  if (i % 3 == 0) {
    return "green";
  }
  if (i % 2 == 0) {
    return "blue";
  }
  return "red";
}

// Draw the rectangles and close the ones without balls
function draw_and_close_rectangles() {
  closed_rectangles = [];
  for (var i=0; i < all_rectangles.length; i++) {
    var rect = all_rectangles[i];
    if (!has_ball(rect)) {
      // rectangles without balls
      closed_rectangles.push(rect);
      ctx.fillStyle = mondrian_color_from_index(i)
    } else {
      ctx.fillStyle = "black";
    }
    ctx.beginPath();
    // TODO: Figure out why the rectangle placement is wacky
    ctx.rect(rect[0]+6, rect[1]+5, rect[2]-10, rect[3]-10);
    ctx.fill();
    ctx.closePath();
  }
}

// Draw a wall, originating from where the mouse clicked.
function draw_wall(e) {
  wall_audio.currentTime = 0;
  wall_audio.play();

  var x = e.clientX - canvas.offsetLeft;
  var y = e.clientY - canvas.offsetTop;

  // size of squares used to draw the lines
  var thickness = 4;

  // how many pixels before the other lines should one stop?
  var stopbefore = 2;

  // how fast should the walls expand? (in ms)
  var totaltime = 300;

  // check if there is a crash approximately at the clicked point
  var halfthick = thickness / 2;
  for (var dy=-halfthick; dy < halfthick; dy++) {
    for (var dx=-halfthick; dx < halfthick; dx++) {
      if (is_occupied(x+dx, y+dy)) {
        ctx.fillStyle = "orange";
        square(x+dx, y+dy, thickness, thickness);
        return;
      }
    }
  }

  // TODO: Much similar code, refactor into a function

  if (direction == HORIZONTAL) {
    direction = VERTICAL;
    longest = Math.max(y, h-y);
    var steptime = totaltime / longest;
    var stopup = false;
    var stopdown = false;
    for (var i=0; i < longest; i++) {
      if (is_occupied(x, y-(i+stopbefore))) {
        stopup = true;
      }
      if (is_occupied(x, y+(i+stopbefore))) {
        stopdown = true;
      }
      // Draw the upper side of the vertical wall
      if (!stopup) {
        if (y-i >= 0) {
          setTimeout(function () {
            var ypos = y-i;
            return (function () {
              unfinished_wall.push([x, ypos]);
              ctx.fillStyle = "blue";
              square(x, ypos, thickness, thickness);
            });
          }(), i*steptime);
        }
      }
      // Draw the lower side of the vertical wall
      if (!stopdown) {
        if (y+1 < h) {
          setTimeout(function () {
            var ypos = y+i;
            return (function () {
              unfinished_wall.push([x, ypos]);
              ctx.fillStyle = "blue"; // "yellow"
              square(x, ypos, thickness, thickness);
            });
          }(), i*steptime);
        }
      }
    }
    // Clear the list of unfinished pieces of the wall once the
    // wall has stopped expanding;
    setTimeout(function() {
      vertical_split(x, y);
      unfinished_wall = [];
      //draw_occupied();
    }, longest*steptime+20);
  } else {
    direction = HORIZONTAL;
    longest = Math.max(x, w-x);
    var steptime = totaltime / longest;
    var stopleft = false;
    var stopright = false;
    for (var i=0; i < longest; i++) {
      if (is_occupied(x-(i+stopbefore), y)) {
        stopleft = true;
      }
      if (is_occupied(x+(i+stopbefore), y)) {
        stopright = true;
      }
      // Draw the left side of the horizontal wall
      if (!stopleft) {
        if (x-i >= 0) {
          setTimeout(function () {
            var xpos = x-i;
            return (function () {
              unfinished_wall.push([xpos, y]);
              ctx.fillStyle = "blue"; // red
              square(xpos, y, thickness, thickness);
            });
          }(), i*steptime);
        }
      }
      // Draw the right side of the horizontal wall
      if (!stopright) {
        if (x+i < w) {
          setTimeout(function () {
            var xpos = x+i;
            return (function () {
              unfinished_wall.push([xpos, y]);
              ctx.fillStyle = "blue"; // green";
              square(xpos, y, thickness, thickness);
            });
          }(), i*steptime);
        }
      }
    }
    // Clear the list of unfinished pieces of the wall once the
    // wall has stopped expanding;
    setTimeout(function() {
      horizontal_split(x, y);
      unfinished_wall = [];
      //draw_occupied();
    }, longest*steptime+20);
  }
}

// TODO: Calculate how large percentage of the board is covered by closed rectangles
function percentage_covered() {
  var everything = w * h;
  var sum = 0;
  for (var i=0; i < closed_rectangles.length; i++) {
    var rect = closed_rectangles[i];
    sum += rect[2] * rect[3];
  }
  return sum / everything;
}

// Random number from 0 up to n
function rand(n) {
  return Math.floor((Math.random()*n));
}

function create_random_balls(n) {
  for (var i=0; i < n; i++) {
    var ball = [rand(w), rand(h), rand(10)+2, rand(10)+2];
    all_balls.push(ball);
  }
}

function mouse_down_handler(e) {
  if (!stopped) {
    clickcounter += 1;
    draw_wall(e);
  }
}

function pause_handler() {
  if (!stopped) {
    stopped = true;
    paused = true;
    if (audio) {
      background_music.pause();
    }
    pause_button.disabled = true;
    resume_button.disabled = false;
  }
  draw_information();
}

function resume_handler(e) {
  if (paused) {
    paused = false;
    stopped = false;
    if (audio) {
      background_music.play();
    }
    pause_button.disabled = false;
    resume_button.disabled = true;
  }
}

//function submit_highscore(jsondata) {
//  var url = "http://sliceball.roboticoverlords.org:9000/api/v1/addrecord/1"
//  var client = new XMLHttpRequest();
//  client.open("PUT", url, false);
//  client.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
//  client.send(jsondata);
//  if (client.status == 200) {
//    alert("The request succeeded!\n\nThe response representation was:\n\n" + client.responseText)
//  } else {
//    alert("The request did not succeed!\n\nThe response status was: " + client.status + " " + client.statusText + ".");
//  }
//}

function get_highscore() {
  var url = "http://sliceball.roboticoverlords.org:9000/api/v1/getrecord/1"
  var client = new XMLHttpRequest();
  client.open("GET", url, false);
  client.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  client.send();
  if (client.status == 200) {
    alert("The request succeeded!\n\nThe response representation was:\n\n" + client.responseText)
  } else {
    alert("The request did not succeed!\n\nThe response status was: " + client.status + " " + client.statusText + ".");
  }
}

// HTTP POST, REST+JSON
function POST(url, object, callback) {
    $.ajax({
        'type': 'POST',
        'url': url,
        'processData': false,
        'data': JSON.stringify(object),
        contentType: 'application/json',
        success: function () { callback(); }
    });
};

// HTTP GET, REST+JSON
function GET(url, callback) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: url,
        contentType: 'application/json',
        processData: false,
        success: function (object) { callback(object); }
    });
};

function view_highscores() {
  // TODO: Retrieve the highscore list from the server and display it here.
  //var hs = "";
  //hs += "1. Bob : 123 points = 95% coverage in 3 seconds with 10 clicks\n";
  //hs += "2. Patty : 97 points = 95% coverage in 4 seconds with 12 clicks\n";
  //alert(hs);
  //submit_highscore('{x:"2"}');

  infotext.innerHTML = "---";

  var myobject1 = new Object();
  myobject1.x = 9;
  myobject1.y = 7;
  myobject1.name = "Alexander";

  POST("http://sliceball.roboticoverlords.org/api/v1/addrecord/1", myobject1, function() {
    console.log("POST success");

    GET("http://sliceball.roboticoverlords.org/api/v1/getrecord/1", function(object) {
      console.log("GET success");
      console.log(object.name);
    });

  });

}

function new_game() {
  gamestart = new Date().getTime();
  clickcounter = 0;
  // Start at level 1
  init(1);
}

function sound_on() {
  audio = true;
  sound_on_button.disabled = true;
}

// Initialize the event handlers and few global variables that are used.
// Called when <body> in index.html is loaded.
function init(level) {
  canvas = document.getElementById('sliceball');
  ctx = canvas.getContext("2d");
  w = canvas.width;
  h = canvas.height;

  wall_audio = document.getElementById("lazer");
  bounce_audio = document.getElementById("bounce2");
  rectangle_audio = document.getElementById("new_fresh");
  explode_audio = document.getElementById("explode");
  win_audio = document.getElementById("win");
  background_music = document.getElementById("computermusic");
  youwon_music = document.getElementById("youwon");
  gameover_music = document.getElementById("gameover");

  audio = false;

  infotext = document.getElementById("infotext");
  titletext = document.getElementById("title");
  newgame_button = document.getElementById("newgame");
  pause_button = document.getElementById("pause");
  resume_button = document.getElementById("resume");
  sound_on_button = document.getElementById("sound on");

  pause_button.disabled = false;
  resume_button.disabled = true;

  current_level = level;

  // 7 levels with various requirements for coverage percentage and maximum amount of seconds + winning text
  levels = [[0.5, 60, "NICE"], [0.7, 50, "AMAZING"], [0.8, 40, "WOW"], [0.9, 30, "INCREDIBLE"], [0.95, 20, "BAFFLED"], [0.97, 20, "OUTSTANDING"], [0.98, 10, "WIN"]];

  direction = HORIZONTAL;
  occupied = {};

  all_rectangles = [[0, 0, w, h]];
  closed_rectangles = [];
  all_balls = [];
  unfinished_wall = [];

  stopped = false;
  paused = false;

  information = "";

  stuckcounter = 0;
  starttime = new Date().getTime();

  // TODO: Use the level list and current_level
  target_coverage = levels[current_level-1][0];
  deadline = starttime + (1000 * levels[current_level-1][1]);

  create_random_balls(5);
  last_balls = [];

  clearInterval(level_up_animation);
  clearInterval(game_over_animation);

  draw_balls();

  // Update the graphics every 20 ms
  clearInterval(innerloop);
  innerloop = setInterval(every_loop, 20);

  // Doesn't need to update the level info as often as the graphics
  clearInterval(infoloop);
  infoloop = setInterval(level_info, 200);

  // Start the music
  if (audio) {
    background_music.pause();
    background_music.currentTime = 0;
    background_music.play();
  }

  // Handle mouse clicks
  canvas.removeEventListener("mousedown", mouse_down_handler);
  canvas.addEventListener("mousedown",mouse_down_handler, false);

  // Handle touches
  //canvas.removeEventListener("touchstart", mouse_down_handler);
  //canvas.addEventListener("touchstart",mouse_down_handler, false);
}
