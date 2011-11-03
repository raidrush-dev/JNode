<?php

/**
 * creates the dist version of JHP
 * 
 * just execute it and you're done
 */

print 'building ... ';

$dist = fopen(__DIR__ . '/dist/jnode.js', 'w');
build($dist, 'jnode.js');
fclose($dist);

print 'done.' . PHP_EOL;

// ------------------------------

function build($dist, $file) {   
  $file = __DIR__ . '/src/' . $file;
  
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
          $line = build($dist, $split[1]);
          break;
      }
    }
    
    fwrite($dist, $line);
  }
}

