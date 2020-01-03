<?php

///////////////////////////////////////////////////////////////////////////////////////////////////

// functions for constructing ABIF-specific data types
function ABIF_short($x) { if ($x >= pow(2, 15)) { $x -= pow(2, 16); } return $x; }
function ABIF_long($x)  { if ($x >= pow(2, 31)) { $x -= pow(2, 32); } return $x; }
function ABIF_float($strHex) {

    $hex = sscanf($strHex, "%02x%02x%02x%02x");
    $bin = implode('', array_map('chr', $hex));
    $array = unpack("Gnum", $bin);
    return $array['num'];

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function ABIF_double($strHex) {

    $hex = sscanf($strHex, "%02x%02x%02x%02x%02x%02x%02x%02x");
    $bin = implode('', array_map('chr', $hex));
    $array = unpack("Enum", $bin);
    return $array['num'];

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function ABIF_char_array_to_string($array) {

    $string = '';
    foreach ($array as $ASCII) { $string .= chr($ASCII); }
    return $string;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function read_ABIF($filename) {

    /////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Opens an ABIF (Applied Biosystems Information File; including files with extension .AB1), and
    // returns an ABIF array structure containing all of the elements of the file (see below).
    //
    /////////////////////////////////////////////////////////////////////////////////////////////////

    // local variables
    $handle             =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the returned handle of the opened ABIF file
    $contents           =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the binary contents of the ABIF file
    $header             =   NULL;           // [NOT EDITABLE | AUTOUPDATE] an array containing the ABIF file header fields
    $header_format      =   '';             // [NOT EDITABLE | AUTOUPDATE] the specified format of the ABIF file header
    $directory          =   array();        // [NOT EDITABLE | AUTOUPDATE] an array of the directory elements
    $directory_format   =   '';             // [NOT EDITABLE | AUTOUPDATE] the specified format of the ABIF directory entries
    $directory_offset   =   0;              // [NOT EDITABLE | AUTOUPDATE] the current directory offset location
    $delta              =   0;              // [NOT EDITABLE | AUTOUPDATE] the difference between the specified and actual offset addresses
    $index              =   0;              // [NOT EDITABLE | AUTOUPDATE] the index for looping through directory elements
    $type               =   '';             // [NOT EDITABLE | AUTOUPDATE] a string containing an unpack data type
    $offset             =   0;              // [NOT EDITABLE | AUTOUPDATE] data offset
    $format             =   '';             // [NOT EDITABLE | AUTOUPDATE] the overall format used for the unpack function; '@'.$offset.'/'.$type
    $package            =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the binary data to extract for each file element
    $keyName            =   '';             // [NOT EDITABLE | AUTOUPDATE] the constructed key name; $element['name'].'_'.$element['number']
    $key                =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the key variable of a key => value pair
    $value              =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the value variable of a key => value pair
    $ABIF               =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the data structure holding all of the relevant electropherogram information
    $x                  =   NULL;           // [NOT EDITABLE | AUTOUPDATE] empty variable to hold unpacked data
    $unknownType        =   array();        // [NOT EDITABLE | AUTOUPDATE] an array containing any encountered unknown element types

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // $ABIF STRUCTURE ////////////////////////////////////////////////////////////////////////////////
    //
    // The $ABIF structure consists of an array of key => value pairs.  Each key corresponds to
    // an element name in the ABIF file, followed by an underscore and the associated element number.
    // For example, the key HCFG_3 contains a string for the official instrument name used to
    // generate the DNA sequence, going by the Applied Bioscience 3500/3500cl Genetic Analyzer tag set.
    // A more detailed explanation of the ABIF file format, and the available element name/number pairs
    // is available as an associated PDF file in this directory, titled ABIF_File_Format.PDF.  One
    // additional key has been added, called unknownType, which contains an array of unidentified
    // element types, which should be useful for updating this function if the ABIF format evolves.
    // This function returns false if the file is not of type ABIF.
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////////


    // establish the header format (128 bytes total)
    $header_format  = 'A4filetype/';        // 4 bytes; 4 characters; string must equal "ABIF"
    $header_format .= 'n1version/';         // 2 bytes; unsigned 16-bit integer; 101 = version 1.1
    $header_format .= 'A4name/';            // 4 bytes; 4 characters; string must equal "tdir" for tag directory name
    $header_format .= 'N1number/';          // 4 bytes; signed 32-bit integer (read as unsigned); must equal 1 for tag directory number
    $header_format .= 'n1elementtype/';     // 2 bytes; signed 16-bit integer (read as unsigned); tag element type code
    $header_format .= 'n1elementsize/';     // 2 bytes; signed 16-bit integer (read as unsigned); size in bytes of one element
    $header_format .= 'N1numelements/';     // 4 bytes; signed 32-bit integer (read as unsigned); number of elements in item
    $header_format .= 'N1datasize/';        // 4 bytes; signed 32-bit integer (read as unsigned); size in bytes of item
    $header_format .= 'N1dataoffset/';      // 4 bytes; signed 32-bit integer (read as unsigned); item's data or offset in file
    $header_format .= 'N1datahandle/';      // 4 bytes; signed 32-bit integer (read as unsigned); reserved

    // establish the directory entry format
    $directory_format  = 'A4name/';         // 4 bytes; 4 characters; string containing the tag name
    $directory_format .= 'N1number/';       // 4 bytes; signed 32-bit integer (read as unsigned); tag number; a positive integer from 1 to 1000
    $directory_format .= 'n1elementtype/';  // 2 bytes; signed 16-bit integer (read as unsigned); tag element type code
    $directory_format .= 'n1elementsize/';  // 2 bytes; signed 16-bit integer (read as unsigned); size in bytes of one element
    $directory_format .= 'N1numelements/';  // 4 bytes; signed 32-bit integer (read as unsigned); number of elements in item
    $directory_format .= 'N1datasize/';     // 4 bytes; signed 32-bit integer (read as unsigned); size in bytes of item
    $directory_format .= 'N1dataoffset';    // 4 bytes; signed 32-bit integer (read as unsigned); item's data or offset in file

    // open the file
    $handle = fopen($filename, "rb");  if (!$handle) { return false; }
    $contents = fread($handle, filesize($filename));

    // read the 128-bit header
    $header = unpack($header_format, $contents);

    // check the file type
    if ($header['filetype'] != 'ABIF') { return false; }

    // calculate the true directory offset
    //$directory_offset = filesize($filename) - $header['datasize'];
    //$delta = $directory_offset - $header['dataoffset'];

    // loop through the directory elements
    for ($index = 0; $index < $header['numelements']; $index++) {

        //$directory[] = unpack($directory_format, $contents, ($directory_offset + ($header['elementsize'] * $index)));   // the 3rd argument (offset) is only available in PHP 7.1 and above
        $directory[] = unpack($directory_format, $contents, ($header['dataoffset'] + ($header['elementsize'] * $index)));   // the 3rd argument (offset) is only available in PHP 7.1 and above

    } // end for loop

    // extract the file information
    // for Applied Biosystems 3500/3500xl Genetic Analyzer Tags
    foreach ($directory as $element) {

        // identify the source package
        if ($element['datasize'] > 4) {

            $package = $contents;
            $offset = $element['dataoffset'];

        } // end if
        else { $package = pack('N*', $element['dataoffset']); $offset = 0; }

        switch ($element['elementtype']) {

            case 1:  { $type = 'C'.($element['datasize'] / $element['elementsize']); break; }   // byte
            case 2:  { $type = 'C'.($element['datasize'] / $element['elementsize']); break; }   // char
            case 3:  { $type = 'n'.($element['datasize'] / $element['elementsize']); break; }   // word
            case 4:  { $type = 'n'.($element['datasize'] / $element['elementsize']); break; }   // short    [NOTE: convert with ABIF_short() function]
            case 5:  { $type = 'N'.($element['datasize'] / $element['elementsize']); break; }   // long     [NOTE: convert with ABIF_long() function]

            // float [NOTE: convert with ABIF_float() function]
            case 7:  {
                $type = 'H'.($element['elementsize'] * 2).'float0';
                if ($element['datasize'] > $element['elementsize']) {
                    for ($index = 1; $index < ($element['datasize'] / $element['elementsize']); $index++) {
                        $type .= '/H'.($element['elementsize'] * 2).'float'.$index;
                    } // end for loop
                } // end if
                break;
            } // end case

            // double [NOTE: convert with ABIF_double() function]
            case 8:  {
                $type = 'H'.($element['elementsize'] * 2).'double0';
                if ($element['datasize'] > $element['elementsize']) {
                    for ($index = 1; $index < ($element['datasize'] / $element['elementsize']); $index++) {
                        $type .= '/H'.($element['elementsize'] * 2).'double'.$index;
                    } // end for loop
                } // end if
                break;
            } // end case

            case 10: { $type = 'n1year/C1month/C1day'; break; }                 // date     [2-byte 4-digit year; 1-byte month (1 - 12); 1-byte day (1 - 31)]
            case 11: { $type = 'C1hour/C1minute/C1second/C1hsecond'; break; }   // time     [1-byte hour (0 - 23); 1-byte minute (0 - 59); 1-byte second (0 - 59); 1-byte hsecond (0 - 99)]
            case 18: { $type = 'A'.($element['datasize']); break; }             // pString  [Pascal string; consists of a character count in the first byte (0 - 255) followed by the 8-bit ASCII characters; the number of elements is equal to the number of characters plus one
            case 19: { $type = 'A'.($element['datasize'] - 1); break; }         // cString  [C-style string; consists of a string of 8-bit ASCII characters followed by a NULL (zero) byte; the number of elements is equal to the number of characters plus one

            default: {

                $unknownType[$element['name']] = $element['elementtype'];
                $type = 'H'.($element['elementsize'] * 2);
                break;

            } // end default

        } // end switch

        // generate the unpack format and the ABIF key name
        if ($offset) { $format = '@'.$offset.'/'.$type; } else { $format = $type; }
        $keyName = $element['name'].'_'.$element['number'];

        // unpack the element
        $x = unpack($format, $package);

        // additional data type processing
        switch ($element['elementtype']) {

            case  4: { foreach($x as $key => $value) { $x[$key] = ABIF_short($value);  } break; }
            case  5: { foreach($x as $key => $value) { $x[$key] = ABIF_long($value);   } break; }
            case  7: { foreach($x as $key => $value) { $x[$key] = ABIF_float($value);  } break; }
            case  8: { foreach($x as $key => $value) { $x[$key] = ABIF_double($value); } break; }
            case 18: { $x[1] = substr($x[1], 1); break; } // remove the first character of the pString

            default: break;

        } // end switch

        // transfer the values to the ABIF data structure
        if (count($x) == 1) { reset($x); $ABIF[$keyName] = $x[key($x)]; } else { $ABIF[$keyName] = $x; }

    } // end foreach

    // close the file
    fclose($handle);

    $ABIF['unknownType'] = $unknownType;

    return $ABIF;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function peakArea($ABIF, $peakNumber, $nucleotide) {

    // calculates the area under a peak in the electropherogram.  Is both minima of the peak
    // are at baseline (zero) then the area will be exact.  Otherwise, the area will be estimated.

    $x              =   0;      // [NOT EDITABLE | AUTOUPDATE] the x-value of the designated peak
    $xLeft          =   0;      // [NOT EDITABLE | AUTOUPDATE] trace x-value
    $xRight         =   0;      // [NOT EDITABLE | AUTOUPDATE] trace x-value
    $y              =   0;      // [NOT EDITABLE | AUTOUPDATE] trace y-value
    $yLeft          =   0;      // [NOT EDITABLE | AUTOUPDATE] trace y-value
    $yRight         =   0;      // [NOT EDITABLE | AUTOUPDATE] trace y-value
    $minimumLeft    =   0;      // [NOT EDITABLE | AUTOUPDATE] the x-value of the left-most lowest y
    $minimumRight   =   0;      // [NOT EDITABLE | AUTOUPDATE] the x-value of the right-most lowest y
    $trace          =   NULL;   // [NOT EDITABLE | AUTOUPDATE] the proper nucleotide trace
    $length         =   0;      // [NOT EDITABLE | AUTOUPDATE] the size of the trace
    $leftTailArea   =   0;      // [NOT EDITABLE | AUTOUPDATE] the area of the left tail (calculated if the y-value at minimumLeft is not zero)
    $rightTailArea  =   0;      // [NOT EDITABLE | AUTOUPDATE] the area of the right tail (calculated if the y-value at minimumRight is not zero)
    $centralArea    =   0;      // [NOT EDITABLE | AUTOUPDATE] the area between the left and right minima (the sum of the y-values at each x-value, inclusive)
    $index          =   0;      // [NOT EDITABLE | AUTOUPDATE] and index used in for loops
    $slope          =   0;      // [NOT EDITABLE | AUTOUPDATE] the slope of the curve of the peak
    $area           =   0;      // [NOT EDITABLE | AUTOUPDATE] the area under the curve

    // make sure that a valid nucleotide was entered
    if (($nucleotide !== 'G') && ($nucleotide !== 'A') && ($nucleotide !== 'T') && ($nucleotide !== 'C')) { return 0; }

    // determine the order of the traces
    foreach ($ABIF['FWO__1'] as $key => $value) {

        if ($nucleotide == chr($value)) { $trace = $ABIF['DATA_'.(8 + $key)]; }

    } // end foreach

    $length = sizeof($trace);

    // find the peak x location
    $x = $ABIF['PLOC_1'][$peakNumber];

    // find the true peak
    $y = $trace[$x];
    $xLeft  = $x;
    $xRight = $x;
    while (($trace[$xLeft  - 1] > $trace[$xLeft])  && ($xLeft  >       0)) { $xLeft--;  $yLeft  = $trace[$xLeft];  }
    while (($trace[$xRight + 1] > $trace[$xRight]) && ($xRight < $length)) { $xRight++; $yRight = $trace[$xRight]; }
    if ($yLeft > $y) { $x = $xLeft; }
    elseif ($yRight > $y) { $x = $xRight; }

    // find the left and right minima
    $minimumLeft = $x;
    $minimumRight = $x;
    $xLeft  = $x;
    $xRight = $x;
    $y = $trace[$x];
    while(($trace[$xLeft  - 1] <= $trace[$xLeft])  && ($xLeft  >       0)) { $xLeft--;  $minimumLeft  = $xLeft;  }
    while(($trace[$xRight + 1] <= $trace[$xRight]) && ($xRight < $length)) { $xRight++; $minimumRight = $xRight; }

    // find the central area
    for ($index = $minimumLeft; $index <= $minimumRight; $index++) { $centralArea += $trace[$index]; }

    // calculate the left tail area
    if ($trace[$minimumLeft] > 0) {

        // calculate the slope
        $slope = ($trace[$x] - $trace[$minimumLeft]) / ($x - $minimumLeft);
        $y = $trace[$minimumLeft] - $slope;
        if ($slope > 0) { while ($y > 0) { $leftTailArea += $y; $y -= $slope; } }

    } // end if

    // calculate the right tail area
    if ($trace[$minimumRight] > 0) {

        // calculate the slope
        $slope = ($trace[$x] - $trace[$minimumRight]) / ($minimumRight - $x);
        $y = $trace[$minimumRight] - $slope;
        if ($slope > 0) { while ($y > 0) { $rightTailArea += $y; $y -= $slope; } }

    } // end if

    // calculate the overall area
    $area = $leftTailArea + $centralArea + $rightTailArea;

    return $area;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function Mquant($ABIF, $nucleotideNumber, $map) {

    $TPeaks     =   10;                         // [NOT EDITABLE | AUTOUPDATE] the number of T peaks required by the Mquant algorithm
    $TArea      =   0;                          // [NOT EDITABLE | AUTOUPDATE] the area of the current T peak
    $N          =   '';                         // [NOT EDITABLE | AUTOUPDATE] nucleotide
    $NArea      =   0;                          // [NOT EDITABLE | AUTOUPDATE] the area of the seconary peak
    $TBar       =   0;                          // [NOT EDITABLE | AUTOUPDATE] the average T peak area
    $index      =   0;                          // [NOT EDITABLE | AUTOUPDATE] general index variable
    $ratio      =   0;                          // [NOT EDITABLE | AUTOUPDATE] general ratio variable
    $length     =   sizeof($ABIF['PBAS_1']);    // [NOT EDITABLE | AUTOUPDATE] the length of the sequence
    $deltaT     =   0;                          // [NOT EDITABLE | AUTOUPDATE] the difference between TBar and the area of the T peak at the site of methylation
    $Mquant     =   0;                          // [NOT EDITABLE | AUTOUPDATE] the percent of DNA methylated at the target CpG location (delta T / TBar)

    // step 1:  Find the area of 10 T's around the target methylations site (5 on each side).
    //  The area of each T must be at least 10X the area of the secondary base.

    // make sure that the primary nucleotide is a C, T, or N
    $index = $nucleotideNumber;
    if ((chr($ABIF['PBAS_1'][$index]) !== 'C') && (chr($ABIF['PBAS_1'][$index]) !== 'T') && (chr($ABIF['PBAS_1'][$index]) !== 'N')) { return 0.00; }

    // scan to the left for five T's
    while (($TPeaks > 5) && ($index > 0)) {

        // check to see if the nucleotide at this location is a T
        if ((chr($ABIF['PBAS_1'][$index]) == 'T') && ($map[$index] !== 1)) {

            // get the secondary nucleotide
            $N = chr($ABIF['P2BA_1'][$index]);

            // get the area of the T peak and secondary nucleotide peak
            $TArea = peakArea($ABIF, $index, 'T');
            $NArea = peakArea($ABIF, $index, $N );

            // calculate the ratio of the two peaks
            $ratio = $NArea / $TArea;

            // check to see if the secondary peak area is less than 10% of the T peak area
            if ($ratio <= 0.1) { $TBar += $TArea; $TPeaks--; }

        } // end if (T check)

        $index--;

    } // end while

    // scan to the right for the remaining T's (ten total between left and right)
    $index = $nucleotideNumber;
    while (($TPeaks > 0) && ($index <= $length)) {

        // check to see if the nucleotide at this location is a T
        // and the location is not within a CpG dinucleotide
        if ((chr($ABIF['PBAS_1'][$index]) == 'T') && ($map[$index] !== 1)) {

            // get the secondary nucleotide
            $N = chr($ABIF['P2BA_1'][$index]);

            // get the area of the T peak and secondary nucleotide peak
            $TArea = peakArea($ABIF, $index, 'T');
            $NArea = peakArea($ABIF, $index, $N );

            // calculate the ratio of the two peaks
            $ratio = $NArea / $TArea;

            // check to see if the secondary peak area is less than 10% of the T peak area
            if ($ratio <= 0.1) { $TBar += $TArea; $TPeaks--; }

        } // end if (T check)

        $index++;

    } // end while

    // calculate the average T peak area (TBar)
    $TBar = $TBar / (10 - $TPeaks);

    // find the area of the T peak at the site of methylation
    $TArea = peakArea($ABIF, $nucleotideNumber, 'T');

    // calculate delta T
    $deltaT = abs($TBar - $TArea);

    // calculate the percent methylation
    $Mquant = $deltaT / $TBar;

    if ($Mquant > 1.00) { $Mquant = 1.00; }

    return $Mquant;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function MquantComplement($ABIF, $nucleotideNumber, $map) {

    $APeaks         =   10;                         // [NOT EDITABLE | AUTOUPDATE] the number of T peaks required by the Mquant algorithm
    $AArea          =   0;                          // [NOT EDITABLE | AUTOUPDATE] the area of the current T peak
    $N              =   '';                         // [NOT EDITABLE | AUTOUPDATE] nucleotide
    $NArea          =   0;                          // [NOT EDITABLE | AUTOUPDATE] the area of the seconary peak
    $ABar           =   0;                          // [NOT EDITABLE | AUTOUPDATE] the average T peak area
    $index          =   0;                          // [NOT EDITABLE | AUTOUPDATE] general index variable
    $ratio          =   0;                          // [NOT EDITABLE | AUTOUPDATE] general ratio variable
    $length         =   sizeof($ABIF['PBAS_1']);    // [NOT EDITABLE | AUTOUPDATE] the length of the sequence
    $deltaA         =   0;                          // [NOT EDITABLE | AUTOUPDATE] the difference between TBar and the area of the T peak at the site of methylation
    $Mquant         =   0;                          // [NOT EDITABLE | AUTOUPDATE] the percent of DNA methylated at the target CpG location (delta T / TBar)
    $mapLength      =   0;                          // [NOT EDITABLE | AUTOUPDATE] the length of the $map array (used to flip $map)
    $flippedArray   =   array();                    // [NOT EDITABLE | AUTOUPDATE] an array used to flip $map

    // flip the map array
    $mapLength = sizeof($map);
    for ($index = 1; $index <= $mapLength; $index++) { $flippedArray[$index] = $map[($mapLength - $index) + 1]; }
    $map = $flippedArray;

    // step 1:  Find the area of 10 A's around the target methylations site (5 on each side).
    //  The area of each A must be at least 10X the area of the secondary base.

    // make sure that the primary nucleotide is a G, A, or N
    $index = ($length - $nucleotideNumber) + 1;
    if ((chr($ABIF['PBAS_1'][$index]) !== 'G') && (chr($ABIF['PBAS_1'][$index]) !== 'A') && (chr($ABIF['PBAS_1'][$index]) !== 'N')) { return 0.00; }

    // scan to the left for five T's
    while (($APeaks > 5) && ($index > 0)) {

        // check to see if the nucleotide at this location is an A
        if ((chr($ABIF['PBAS_1'][$index]) == 'A') && ($map[$index] !== 1)) {

            // get the secondary nucleotide
            $N = chr($ABIF['P2BA_1'][$index]);

            // get the area of the A peak and secondary nucleotide peak
            $AArea = peakArea($ABIF, $index, 'A');
            $NArea = peakArea($ABIF, $index, $N );

            // calculate the ratio of the two peaks
            $ratio = $NArea / $AArea;

            // check to see if the secondary peak area is less than 10% of the A peak area
            if ($ratio <= 0.1) { $ABar += $AArea; $APeaks--; }

        } // end if (A check)

        $index--;

    } // end while

    // scan to the right for the remaining T's (ten total between left and right)
    $index = ($length - $nucleotideNumber) + 1;
    while (($APeaks > 0) && ($index <= $length)) {

        // check to see if the nucleotide at this location is an A
        // and the location is not within a CpG dinucleotide
        if ((chr($ABIF['PBAS_1'][$index]) == 'A') && ($map[$index] !== 1)) {

            // get the secondary nucleotide
            $N = chr($ABIF['P2BA_1'][$index]);

            // get the area of the A peak and secondary nucleotide peak
            $AArea = peakArea($ABIF, $index, 'A');
            $NArea = peakArea($ABIF, $index, $N );

            // calculate the ratio of the two peaks
            $ratio = $NArea / $AArea;

            // check to see if the secondary peak area is less than 10% of the A peak area
            if ($ratio <= 0.1) { $ABar += $AArea; $APeaks--; }

        } // end if (A check)

        $index++;

    } // end while

    // calculate the average A peak area (ABar)
    $ABar = $ABar / (10 - $APeaks);

    // find the area of the A peak at the site of methylation
    $AArea = peakArea($ABIF, (($length - $nucleotideNumber) + 1), 'A');

    // calculate delta A
    $deltaA = abs($ABar - $AArea);

    // calculate the percent methylation
    $Mquant = $deltaA / $ABar;

    if ($Mquant > 1.00) { $Mquant = 1.00; }

    return $Mquant;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function addMquant($ABIF, $alignmentInfo) {

    if (!$alignmentInfo['location']['methylation']) { return $alignmentInfo; }

    foreach ($alignmentInfo['location']['methylation'] as $peak) { $alignmentInfo['Mquant'][$peak] = Mquant($ABIF, $peak, $alignmentInfo['map']['methylation']); }

    return $alignmentInfo;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function addMquantComplement($ABIF, $alignmentInfo) {

    if (!$alignmentInfo['location']['methylation']) { return $alignmentInfo; }

    foreach ($alignmentInfo['location']['methylation'] as $peak) { $alignmentInfo['Mquant'][$peak] = MquantComplement($ABIF, $peak, $alignmentInfo['map']['methylation']); }

    return $alignmentInfo;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function transferMquant($source, $destination) {

    $index = 0;
    $Mquant = array();

    if ((!$source['Mquant']) || (!$destination['location']['methylation'])) { return $destination; }

    foreach ($source['Mquant'] as $value) { $Mquant[] = $value; }

    $length = sizeof($Mquant);

    foreach ($destination['location']['methylation'] as $peak) { if ($index < $length) { $destination['Mquant'][$peak] = $Mquant[$index]; $index++; } }

    return $destination;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function qualityTrim($ABIF) {

    $max             = 0;
    $upperThreshold  = 24;
    $lowerThreshold  = 15;

    $length = sizeof($ABIF['PCON_1']);

    $trimLoc = $length;

    for ($index = 6; $index <= ($length - 5); $index++) {

        $average  = $ABIF['PCON_1'][$index - 5] + $ABIF['PCON_1'][$index - 4] + $ABIF['PCON_1'][$index - 3] + $ABIF['PCON_1'][$index - 2] + $ABIF['PCON_1'][$index - 1];
        $average += $ABIF['PCON_1'][$index + 5] + $ABIF['PCON_1'][$index + 4] + $ABIF['PCON_1'][$index + 3] + $ABIF['PCON_1'][$index + 2] + $ABIF['PCON_1'][$index + 1];
        $average  = $average / 10;

        if ($average > $max) { $max = $average; }

        if (($max > $upperThreshold) && ($average < $lowerThreshold)) { $trimLoc = $index; $max = $average; }

    } // end for loop

    for ($index = 1; $index <= $length; $index++) {

        if ($index >= $trimLoc) {

            unset($ABIF['PCON_1'][$index]);
            unset($ABIF['PBAS_1'][$index]);
            unset($ABIF['PBAS_2'][$index]);
            unset($ABIF['PLOC_1'][$index]);
            unset($ABIF['PLOC_2'][$index]);

        } // end if

    } // end for loop

    return $ABIF;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// [ DISPLAY FUNCTIONS | SUBJECT TO CHANGE]
//
///////////////////////////////////////////////////////////////////////////////////////////////////

function display_ABIF($filename) {

    /////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Opens an ABIF (Applied Biosystems Information File; including files with extension .AB1), and
    // displays the file contents in byte order
    //
    /////////////////////////////////////////////////////////////////////////////////////////////////

    // local variables
    $handle             =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the returned handle of the opened ABIF file
    $contents           =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the binary contents of the ABIF file
    $header             =   NULL;           // [NOT EDITABLE | AUTOUPDATE] an array containing the ABIF file header fields
    $header_format      =   '';             // [NOT EDITABLE | AUTOUPDATE] the specified format of the ABIF file header
    $directory          =   array();        // [NOT EDITABLE | AUTOUPDATE] an array of the directory elements
    $directory_format   =   '';             // [NOT EDITABLE | AUTOUPDATE] the specified format of the ABIF directory entries
    $directory_offset   =   0;              // [NOT EDITABLE | AUTOUPDATE] the current directory offset location
    $delta              =   0;              // [NOT EDITABLE | AUTOUPDATE] the difference between the specified and actual offset addresses
    $index              =   0;              // [NOT EDITABLE | AUTOUPDATE] the index for looping through directory elements
    $type               =   '';             // [NOT EDITABLE | AUTOUPDATE] a string containing an unpack data type
    $offset             =   0;              // [NOT EDITABLE | AUTOUPDATE] data offset
    $format             =   '';             // [NOT EDITABLE | AUTOUPDATE] the overall format used for the unpack function; '@'.$offset.'/'.$type
    $package            =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the binary data to extract for each file element
    $keyName            =   '';             // [NOT EDITABLE | AUTOUPDATE] the constructed key name; $element['name'].'_'.$element['number']
    $key                =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the key variable of a key => value pair
    $value              =   NULL;           // [NOT EDITABLE | AUTOUPDATE] the value variable of a key => value pair
    $fileStructure      =   array();        // [NOT EDITABLE | AUTOUPDATE] the data structure holding all of the relevant electropherogram information
    $x                  =   NULL;           // [NOT EDITABLE | AUTOUPDATE] empty variable to hold unpacked data
    $entry              =   0;

    // establish the header format (128 bytes total)
    $header_format  = 'A4filetype/';        // 4 bytes; 4 characters; string must equal "ABIF"
    $header_format .= 'n1version/';         // 2 bytes; unsigned 16-bit integer; 101 = version 1.1
    $header_format .= 'A4name/';            // 4 bytes; 4 characters; string must equal "tdir" for tag directory name
    $header_format .= 'N1number/';          // 4 bytes; signed 32-bit integer (read as unsigned); must equal 1 for tag directory number
    $header_format .= 'n1elementtype/';     // 2 bytes; signed 16-bit integer (read as unsigned); tag element type code
    $header_format .= 'n1elementsize/';     // 2 bytes; signed 16-bit integer (read as unsigned); size in bytes of one element
    $header_format .= 'N1numelements/';     // 4 bytes; signed 32-bit integer (read as unsigned); number of elements in item
    $header_format .= 'N1datasize/';        // 4 bytes; signed 32-bit integer (read as unsigned); size in bytes of item
    $header_format .= 'N1dataoffset/';      // 4 bytes; signed 32-bit integer (read as unsigned); item's data or offset in file
    $header_format .= 'N1datahandle/';      // 4 bytes; signed 32-bit integer (read as unsigned); reserved

    // establish the directory entry format
    $directory_format  = 'A4name/';         // 4 bytes; 4 characters; string containing the tag name
    $directory_format .= 'N1number/';       // 4 bytes; signed 32-bit integer (read as unsigned); tag number; a positive integer from 1 to 1000
    $directory_format .= 'n1elementtype/';  // 2 bytes; signed 16-bit integer (read as unsigned); tag element type code
    $directory_format .= 'n1elementsize/';  // 2 bytes; signed 16-bit integer (read as unsigned); size in bytes of one element
    $directory_format .= 'N1numelements/';  // 4 bytes; signed 32-bit integer (read as unsigned); number of elements in item
    $directory_format .= 'N1datasize/';     // 4 bytes; signed 32-bit integer (read as unsigned); size in bytes of item
    $directory_format .= 'N1dataoffset';    // 4 bytes; signed 32-bit integer (read as unsigned); item's data or offset in file

    // open the file
    $handle = fopen($filename, "rb");  if (!$handle) { return false; }
    $contents = fread($handle, filesize($filename));

    // read the 128-bit header
    $header = unpack($header_format, $contents);

    // check the file type
    if ($header['filetype'] != 'ABIF') { return false; }

    // calculate the true directory offset, which can be different than what is specified in the file
    $directory_offset = filesize($filename) - $header['datasize'];
    $delta = $directory_offset - $header['dataoffset'];

    // loop through the directory elements
    for ($index = 0; $index < $header['numelements']; $index++) {

        $directory[] = unpack($directory_format, $contents, ($directory_offset + ($header['elementsize'] * $index)));   // the 3rd argument (offset) is only available in PHP 7.1 and above

    } // end for loop

    // include the header in the file structure
    $x = unpack('A128', $contents);

    $entry = 0;
    $fileStructure[$entry] = array();
    $fileStructure[$entry]['start'] = 0;
    $fileStructure[$entry]['end'] = 128;
    $fileStructure[$entry]['tag'] = 'Header';
    if (count($x) == 1) { reset($x); $fileStructure[$entry]['content'] = $x[key($x)]; } else { $fileStructure[$entry]['content'] = $x; }

    // include the directory in the file structure
    $x = unpack('@'.$directory_offset.'/A'.$header['datasize'], $contents);

    $entry = $directory_offset;
    $fileStructure[$entry] = array();
    $fileStructure[$entry]['start'] = $directory_offset;
    $fileStructure[$entry]['end'] = $directory_offset + $header['datasize'];
    $fileStructure[$entry]['tag'] = 'Directory';
    if (count($x) == 1) { reset($x); $fileStructure[$entry]['content'] = $x[key($x)]; } else { $fileStructure[$entry]['content'] = $x; }

    // extract the file information
    foreach ($directory as $element) {

        // identify the source package
        if ($element['datasize'] > 4) {

            $package = $contents;
            $offset = $element['dataoffset'];
            $format = '@'.$offset.'/'.'A'.($element['datasize']);
            $keyName = $element['name'].'_'.$element['number'];
            $x = unpack($format, $package);

            $entry = $offset;
            $fileStructure[$entry] = array();
            $fileStructure[$entry]['start'] = $offset;
            $fileStructure[$entry]['end'] = $offset + $element['datasize'];
            $fileStructure[$entry]['tag'] = $keyName;
            if (count($x) == 1) { reset($x); $fileStructure[$entry]['content'] = $x[key($x)]; } else { $fileStructure[$entry]['content'] = $x; }

        } // end if

    } // end foreach

    // close the file
    fclose($handle);

    ksort($fileStructure);

    echo '<table style="width: 100%; table-layout: fixed;">';
    echo '<tr>';
    echo '<th style="width: 10%">Start</th>';
    echo '<th style="width: 10%">Tag</th>';
    echo '<th style="width: 65%">Content</th>';
    echo '<th style="width: 10%">End</th>';
    echo '</tr>';

    foreach ($fileStructure as $struct) {

        echo '<tr>';
        echo '<td>'.$struct['start'].'</td>';     // start
        echo '<td>'.$struct['tag'].'</td>';       // tag
        echo '<td style="width: inherit; overflow-wrap: break-word;">'.$struct['content'].'</td>';   // content
        echo '<td>'.$struct['end'].'</td>';       // end
        echo '</tr>';

    } // end foreach

    echo '</table>';

    return TRUE;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function display_ABIF_table($ABIF) {

    echo '<table style="width: 100%; table-layout: fixed;">';
    echo '<tr>';
    echo '<th style="width: 20%">Key</th>';
    echo '<th style="width: 75%">Value</th>';
    echo '</tr>';

    foreach ($ABIF as $key => $value) {

        echo '<tr style="width: inherit;">';
        echo '<td>'.$key.'</td>';
        echo '<td style="width: inherit; overflow-wrap: break-word;">';

        if (count($ABIF[$key]) == 1) { echo $value; }
        elseif (count($ABIF[$key]) > 1) { foreach ($ABIF[$key] as $key1 => $value1) { echo '['.$key1.']=>'.$value1.' '; } }

        echo '</td>';
        echo '</tr>';

    } // end foreach

    echo '</table>';

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function display_ABIF_trace_JS($JS_array, $JS_color) {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    // [INTERNAL USE ONLY]
    //
    // A JavaScript (JS) function that take string variables and plugs them into JavaScript code
    // for drawing ABIF trace data on a canvas.
    //
    // The following JavaScript variables must be defined BEFORE this function is called:
    //
    //      context, left, prev_stat, left, move_left_by, and yOffset
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // draw the trace
    echo 'context.strokeStyle="'.$JS_color.'";';
    echo 'left = 0;';
    echo 'prev_stat = '.$JS_array.'[0] + yOffset;';
    echo 'for(stat in '.$JS_array.') {';
    echo 'the_stat = '.$JS_array.'[stat] + yOffset;';
    echo 'context.beginPath();';
    echo 'context.moveTo(left, prev_stat);';
    echo 'context.lineTo(left+move_left_by, the_stat);';
    echo 'context.lineWidth = 2;';
    echo 'context.lineCap = "round";';
    echo 'context.stroke();';
    echo 'context.closePath();';
    echo 'prev_stat = the_stat;';
    echo 'left += move_left_by;';
    echo '}';

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function display_ABIF_electropherogram($ABIF, $nonce = 'default') {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Displays the ABIF file electropherogram trace values and sequence.
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // local variables
    $height     =   400;        // [EDITABLE] the height in pixels of the electropherogram
    $xScale     =   2;          // [EDITABLE] the number of pixels that each measurement takes up in the x-axis
    $width      =   0;          // [NOT EDITABLE | AUTOUPDATE] the width in pixels of the electropherogram (determined by the number of measurements in the trace)
    $x          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current x value
    $y          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current y value
    $yOffset    =   50;         // [NOT EDITABLE | AUTOUPDATE] the amount upwards along the y-axis to offset the traces
    $q          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current QValue
    $maxY       =   0;          // [NOT EDITABLE | AUTOUPDATE] the maximum trace measurement among all four traces (used for scaling the y-axis)
    $yScale     =   1;          // [NOT EDITABLE | AUTOUPDATE] the scaling by which the measurements are multiplied
    $index      =   0;          // [NOT EDITABLE | AUTOUPDATE] an index variable used in for loops
    $peaks      =   0;          // [NOT EDITABLE | AUTOUPDATE] the number of called peaks
    $traceColor =   array();    // [NOT EDITABLE | AUTOUPDATE] the color of each of the four traces (determined by the sequence of characters in FWO__1)
    $key        =   0;          // [NOT EDITABLE | AUTOUPDATE] the key of a key => value pair
    $value      =   0;          // [NOT EDITABLE | AUTOUPDATE] the value of a key => value pair
    $nucleotide =   '';         // [NOT EDITABLE | AUTOUPDATE] G, A, T, C, or N
    $color      =   '';         // [NOT EDITABLE | AUTOUPDATE] a color value
    $GUID       =   uniqid();   // [NOT EDITABLE | AUTOUPDATE] a unique ID

    // determine the trace colors
    foreach ($ABIF['FWO__1'] as $key => $value) {

        $nucleotide = chr($value);

        switch ($nucleotide) {

            case 'G': { $traceColor[$key] = '#000000'; break; } // black
            case 'A': { $traceColor[$key] = '#00FF00'; break; } // green
            case 'T': { $traceColor[$key] = '#FF0000'; break; } // red
            case 'C': { $traceColor[$key] = '#0000FF'; break; } // blue

            default: { $traceColor[$key] = '#000000'; break; } // black

        } // end switch

    } // end foreach

    // find the highest peak
    foreach ($ABIF['DATA_9' ] as $y) { if ($y > $maxY) { $maxY = $y; } } // G (Black trace)
    foreach ($ABIF['DATA_10'] as $y) { if ($y > $maxY) { $maxY = $y; } } // A (Green trace)
    foreach ($ABIF['DATA_11'] as $y) { if ($y > $maxY) { $maxY = $y; } } // T (Red trace)
    foreach ($ABIF['DATA_12'] as $y) { if ($y > $maxY) { $maxY = $y; } } // C (Blue trace)

    $yScale = ($height - ($yOffset + 5)) / $maxY;

    echo '<div style="width: 100%; height: auto; border: 1px solid black; overflow-x: scroll">';
    echo '<canvas id="ABIF_electropherogram_'.$GUID.'"></canvas>';

    $width = count($ABIF['DATA_9']);
    $peaks = count($ABIF['PLOC_1']);

    echo '<script nonce='.$nonce.' id="js_'.$GUID.'">';

    // initialize the JavaScript variables
    echo 'var canvas'.$GUID.' = document.getElementById("ABIF_electropherogram_'.$GUID.'");';
    echo 'var width = canvas'.$GUID.'.width  = '.$width.' * '.$xScale.';';
	echo 'var height = canvas'.$GUID.'.height = '.$height.';';
    echo 'var context = canvas'.$GUID.'.getContext("2d");';          // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var left = 0;';                                   // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var prev_stat = 0;';                              // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var move_left_by = '.$xScale.';';                 // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var yOffset = '.$yOffset.';';                     // must be initialized and defined prior to calling display_ABIF_trace_JS

    // import the trace data
    echo 'var trace1 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_9'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_9'][$width] * $yScale, 0); echo $y.'];';

    echo 'var trace2 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_10'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_10'][$width] * $yScale, 0); echo $y.'];';

    echo 'var trace3 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_11'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_11'][$width] * $yScale, 0); echo $y.'];';

    echo 'var trace4 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_12'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_12'][$width] * $yScale, 0); echo $y.'];';

    // import the peak locations (x-axis values; must be multiplied by xScale when displayed)
    echo 'var peakLocation = [';
    for ($index = 1; $index < $peaks; $index++) { $x = $ABIF['PLOC_1'][$index]; echo $x.', '; }
    $x = $ABIF['PLOC_1'][$peaks]; echo $x.'];';

    echo 'var sequence = [';
    for ($index = 1; $index <= $peaks; $index++) {

        $nucleotide = chr($ABIF['PBAS_1'][$index]);
        echo '"'.$nucleotide.'"';
        if ($index == $peaks) { echo '];'; }
        else { echo ', '; }

    } // end for statement

    echo 'var sequenceColor = [';
    for ($index = 1; $index <= $peaks; $index++) {

        $nucleotide = chr($ABIF['PBAS_1'][$index]);

        switch($nucleotide) {

            case 'G': { $color = '#000000'; break; } // black
            case 'A': { $color = '#00FF00'; break; } // green
            case 'T': { $color = '#FF0000'; break; } // red
            case 'C': { $color = '#0000FF'; break; } // blue
            case 'N': { $color = '#000000'; break; } // black

            default: { $color = '#000000'; break; } // black

        } // end switch

        echo '"'.$color.'"';
        if ($index == $peaks) { echo '];'; }
        else { echo ', '; }

    } // end for statement

    // draw the background
    echo 'context.save();';
    echo 'context.translate(0, height);';
    echo 'context.scale(1, -1);';
    echo 'context.fillStyle = "#FFFFFF";';
    echo 'context.fillRect(0, 0, width, height);';

    // draw the horizontal bar below the traces
    echo 'context.strokeStyle="silver";';
    echo 'context.beginPath();';
    echo 'context.moveTo(0, '.($yOffset - 5).');';
    echo 'context.lineTo('.$width.', '.($yOffset - 5).');';
    echo 'context.lineWidth = 1;';
    echo 'context.stroke();';
    echo 'context.closePath();';

    // display the traces
    display_ABIF_trace_JS('trace1', $traceColor[1]);
    display_ABIF_trace_JS('trace2', $traceColor[2]);
    display_ABIF_trace_JS('trace3', $traceColor[3]);
    display_ABIF_trace_JS('trace4', $traceColor[4]);

    // display the nucleotide sequence
    echo 'context.restore();';
    echo 'context.font = "18px Lucida Console";';
    echo 'context.textAlign = "center";';
    echo 'for(peak in peakLocation) {';
    echo 'context.fillStyle = sequenceColor[peak];';
    echo 'context.fillText(sequence[peak], (peakLocation[peak] * '.$xScale.'), '.(($height - round(($yOffset / 2), 0)) + 9).');';
    echo '}';

    echo '</script>';

    echo '</div>';

    return $GUID;

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function display_ABIF_raw($ABIF, $nonce = 'default') {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Displays the ABIF file raw data trace values.
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // local variables
    $height     =   400;        // [EDITABLE] the height in pixels of the electropherogram
    $xScale     =   2;          // [EDITABLE] the number of pixels that each measurement takes up in the x-axis
    $width      =   0;          // [NOT EDITABLE | AUTOUPDATE] the width in pixels of the electropherogram (determined by the number of measurements in the trace)
    $y          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current y value
    $maxY       =   0;          // [NOT EDITABLE | AUTOUPDATE] the maximum trace measurement among all four traces (used for scaling the y-axis)
    $yScale     =   1;          // [NOT EDITABLE | AUTOUPDATE] the scaling by which the measurements are multiplied
    $index      =   0;          // [NOT EDITABLE | AUTOUPDATE] an index variable used in for loops
    $yOffset    =   50;         // [NOT EDITABLE | AUTOUPDATE] the amount upwards along the y-axis to offset the traces
    $traceColor =   array();    // [NOT EDITABLE | AUTOUPDATE] the color of each of the four traces (determined by the sequence of characters in FWO__1)
    $key        =   0;          // [NOT EDITABLE | AUTOUPDATE] the key of a key => value pair
    $value      =   0;          // [NOT EDITABLE | AUTOUPDATE] the value of a key => value pair
    $nucleotide =   '';         // [NOT EDITABLE | AUTOUPDATE] G, A, T, C, or N

    // determine the trace colors
    foreach ($ABIF['FWO__1'] as $key => $value) {

        $nucleotide = chr($value);

        switch ($nucleotide) {

            case 'G': { $traceColor[$key] = '#000000'; break; } // black
            case 'A': { $traceColor[$key] = '#00FF00'; break; } // green
            case 'T': { $traceColor[$key] = '#FF0000'; break; } // red
            case 'C': { $traceColor[$key] = '#0000FF'; break; } // blue

            default: { $traceColor[$key] = '#000000'; break; }

        } // end switch

    } // end foreach

    // find the highest peak
    foreach ($ABIF['DATA_1'] as $y) { if ($y > $maxY) { $maxY = $y; } } // G (Black trace)
    foreach ($ABIF['DATA_2'] as $y) { if ($y > $maxY) { $maxY = $y; } } // A (Green trace)
    foreach ($ABIF['DATA_3'] as $y) { if ($y > $maxY) { $maxY = $y; } } // T (Red trace)
    foreach ($ABIF['DATA_4'] as $y) { if ($y > $maxY) { $maxY = $y; } } // C (Blue trace)

    $yScale = ($height - 5) / $maxY;

    echo '<div style="width: 100%; height: auto; border: 1px solid black; overflow-x: scroll">';
    echo '<canvas id="ABIF_raw"></canvas>';

    $width = count($ABIF['DATA_1']);

    echo '<script nonce='.$nonce.'>';

    // initialize the JavaScript variables
    echo 'var canvas = document.getElementById("ABIF_raw");';
    echo 'var width = canvas.width = '.$width.';';
	echo 'var height = canvas.height = '.$height.';';
    echo 'var context = canvas.getContext("2d");';          // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var left = 0;';                                   // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var prev_stat = 0;';                              // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var move_left_by = '.$xScale.';';                 // must be initialized and defined prior to calling display_ABIF_trace_JS
    echo 'var yOffset = '.$yOffset.';';                     // must be initialized and defined prior to calling display_ABIF_trace_JS

    // import the trace data
    echo 'var trace1 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_1'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_1'][$width] * $yScale, 0); echo $y.'];';

    echo 'var trace2 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_2'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_2'][$width] * $yScale, 0); echo $y.'];';

    echo 'var trace3 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_3'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_3'][$width] * $yScale, 0); echo $y.'];';

    echo 'var trace4 = [';
    for ($index = 1; $index < $width; $index++) { $y = round($ABIF['DATA_4'][$index] * $yScale, 0); echo $y.', '; }
    $y = round($ABIF['DATA_4'][$width] * $yScale, 0); echo $y.'];';

    // draw the background
    echo 'context.translate(0, height);';
    echo 'context.scale(1, -1);';
    echo 'context.fillStyle = "#FFFFFF";';
    echo 'context.fillRect(0, 0, width, height);';

    // display the traces
    display_ABIF_trace_JS('trace1', $traceColor[1]);
    display_ABIF_trace_JS('trace2', $traceColor[2]);
    display_ABIF_trace_JS('trace3', $traceColor[3]);
    display_ABIF_trace_JS('trace4', $traceColor[4]);

    // draw the horizontal bar below the traces
    echo 'context.strokeStyle="silver";';
    echo 'context.beginPath();';
    echo 'context.moveTo(0, '.($yOffset - 5).');';
    echo 'context.lineTo('.$width.', '.($yOffset - 5).');';
    echo 'context.lineWidth = 1;';
    echo 'context.stroke();';
    echo 'context.closePath();';

    echo '</script>';

    echo '</div>';

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function display_ABIF_qValues($ABIF, $nonce = 'default') {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Displays the ABIF file q-values and sequence.
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // local variables
    $height     =   400;        // [EDITABLE] the height in pixels of the electropherogram
    $xScale     =   2;          // [EDITABLE] the number of pixels that each measurement takes up in the x-axis
    $width      =   0;          // [NOT EDITABLE | AUTOUPDATE] the width in pixels of the electropherogram (determined by the number of measurements in the trace)
    $x          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current x value
    $y          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current y value
    $yOffset    =   50;         // [NOT EDITABLE | AUTOUPDATE] the amount upwards along the y-axis to offset the traces
    $q          =   0;          // [NOT EDITABLE | AUTOUPDATE] the current QValue
    $maxY       =   0;          // [NOT EDITABLE | AUTOUPDATE] the maximum trace measurement among all four traces (used for scaling the y-axis)
    $yScale     =   1;          // [NOT EDITABLE | AUTOUPDATE] the scaling by which the measurements are multiplied
    $index      =   0;          // [NOT EDITABLE | AUTOUPDATE] an index variable used in for loops
    $peaks      =   0;          // [NOT EDITABLE | AUTOUPDATE] the number of called peaks
    $key        =   0;          // [NOT EDITABLE | AUTOUPDATE] the key of a key => value pair
    $value      =   0;          // [NOT EDITABLE | AUTOUPDATE] the value of a key => value pair
    $nucleotide =   '';         // [NOT EDITABLE | AUTOUPDATE] G, A, T, C, or N
    $color      =   '';         // [NOT EDITABLE | AUTOUPDATE] a color value


    $yScale = ($height - ($yOffset + 5)) / 255;

    echo '<div style="width: 100%; height: auto; border: 1px solid black; overflow-x: scroll">';
    echo '<canvas id="ABIF_qValues"></canvas>';

    $width = count($ABIF['DATA_9']);
    $peaks = count($ABIF['PLOC_1']);

    echo '<script nonce='.$nonce.'>';

    // initialize the JavaScript variables
    echo 'var canvas = document.getElementById("ABIF_qValues");';
    echo 'var width = canvas.width = '.$width.';';
	echo 'var height = canvas.height = '.$height.';';
    echo 'var context = canvas.getContext("2d");';
    echo 'var height = '.$height.';';
    echo 'var yScale = '.$yScale.';';
    echo 'var yOffset = '.$yOffset.';';

    // import the peak locations (x-axis values; must be multiplied by xScale when displayed)
    echo 'var peakLocation = [';
    for ($index = 1; $index <= $peaks; $index++) {

        $x = $ABIF['PLOC_1'][$index];
        echo $x;
        if ($index == $peaks) { echo '];'; }
        else { echo ', '; }

    } // end for loop

    echo 'var sequence = [';
    for ($index = 1; $index <= $peaks; $index++) {

        $nucleotide = chr($ABIF['PBAS_1'][$index]);
        echo '"'.$nucleotide.'"';
        if ($index == $peaks) { echo '];'; }
        else { echo ', '; }

    } // end for statement

    echo 'var sequenceColor = [';
    for ($index = 1; $index <= $peaks; $index++) {

        $nucleotide = chr($ABIF['PBAS_1'][$index]);

        switch($nucleotide) {

            case 'G': { $color = '#000000'; break; } // black
            case 'A': { $color = '#00FF00'; break; } // green
            case 'T': { $color = '#FF0000'; break; } // red
            case 'C': { $color = '#0000FF'; break; } // blue
            case 'N': { $color = '#000000'; break; } // black

            default: { $color = '#000000'; break; } // black

        } // end switch

        echo '"'.$color.'"';
        if ($index == $peaks) { echo '];'; }
        else { echo ', '; }

    } // end for statement

    // import sequence of q-values
    echo 'var qValue = [';
    for ($index = 1; $index <= $peaks; $index++) {

        $q = $ABIF['PCON_1'][$index];
        echo $q;
        if ($index == $peaks) { echo '];'; }
        else { echo ', '; }

    } // end for loop

    // draw the background
    echo 'context.save();';
    echo 'context.translate(0, height);';
    echo 'context.scale(1, -1);';
    echo 'context.fillStyle = "#FFFFFF";';
    echo 'context.fillRect(0, 0, width, height);';

    // draw the horizontal bar below the traces
    echo 'context.strokeStyle="silver";';
    echo 'context.beginPath();';
    echo 'context.moveTo(0, '.($yOffset - 5).');';
    echo 'context.lineTo('.$width.', '.($yOffset - 5).');';
    echo 'context.lineWidth = 1;';
    echo 'context.stroke();';
    echo 'context.closePath();';

    // display the q-value bars
    echo 'for(peak in peakLocation) {';
    echo 'context.strokeStyle = sequenceColor[peak];';
    echo 'context.beginPath();';
    echo 'context.moveTo((peakLocation[peak] * '.$xScale.'), '.$yOffset.');';
    echo 'context.lineTo((peakLocation[peak] * '.$xScale.'), (yOffset + (qValue[peak] * yScale)));';
    echo 'context.lineWidth = 1;';
    echo 'context.lineCap = "round";';
    echo 'context.stroke();';
    echo 'context.closePath();';
    echo '}';

    // display the nucleotide sequence
    echo 'context.restore();';
    echo 'context.font = "18px Lucida Console";';
    echo 'context.textAlign = "center";';
    echo 'for(peak in peakLocation) {';
    echo 'context.fillStyle = sequenceColor[peak];';
    echo 'context.fillText(sequence[peak], (peakLocation[peak] * '.$xScale.'), '.(($height - round(($yOffset / 2), 0)) + 9).');';
    echo '}';

    // display the q-value numbers
    echo 'context.font = "12px Lucida Console";';
    echo 'context.fillStyle = "black";';
    echo 'context.textAlign = "center";';
    echo 'for(peak in peakLocation) {';
    echo 'context.fillText(qValue[peak], (peakLocation[peak] * '.$xScale.'), height - ((yOffset + (qValue[peak] * yScale)) + 6));';
    echo '}';

    echo '</script>';

    echo '</div>';

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

?>
