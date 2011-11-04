<?php

/**
 * creates the dist version of JNode
 * 
 * just execute it and you're done
 */
 
print 'Erstelle jnode.js in /dist ... ';

$dist = fopen(__DIR__ . '/dist/jnode.js', 'w');
build($dist, 'jnode.js');
fclose($dist);

print PHP_EOL . PHP_EOL . 'fertig.' . PHP_EOL . PHP_EOL;
print 'Minimiere Code in /dist/jnode.min.js ... ';

// edit path
$yui = 'D:/Coding/YUI Compressor/build/yuicompressor-2.4.6.jar';

if (file_exists($yui)) {
  $cmd = 'java -jar "' . $yui . '" -o "' . __DIR__ 
    . '/dist/jnode.min.js" "' . __DIR__ . '/dist/jnode.js"';

  `$cmd >> nul`;
  print 'fertig.' . PHP_EOL;
} else {
  print 'YUI-Compressor nicht gefunden, überspringe ...' . PHP_EOL;
}

print 'Erstelle JSDoc in /doc ... ';

// edit path
$jdoc = 'D:/Coding/jsdoc-toolkit';

if (file_exists($jdoc)) {
  $cmd = 'java -jar "' . $jdoc . '/jsrun.jar"  "' . $jdoc . '/app/run.js" -a -d="' 
    . __DIR__ . '/doc" -t="' . $jdoc . '/templates/jsdoc" "' . __DIR__ . '/dist/jnode.js"';
    
  `$cmd >> nul`;
  
  print 'fertig. ' . PHP_EOL;
} else {
  print 'JSDoc nicht gefunden, überspringe ... ' . PHP_EOL;
}

print PHP_EOL . 'viel spass!' . PHP_EOL;

// ------------------------------

function build($dist, $file) {   
  $file = __DIR__ . '/src/' . $file;
  
  print PHP_EOL . PHP_EOL . 'Verarbeite: ' . $file;
  
  if (!file_exists($file))
    return;
    
  foreach (file($file) as $line) {
    $trim = trim($line);
    
    if (substr($trim, 0, 3) === '//@') {
      $split = explode(' ', substr($trim, 3));
      
      if (empty($split))
        continue;
        
      switch ($split[0]) {
        case 'require':
          print PHP_EOL . '-> @require (' . $split[1] . ')';
          $line = build($dist, $split[1]);
          break;
      }
    }
    
    fwrite($dist, $line);
  }
}

