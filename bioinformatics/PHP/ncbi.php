<?php
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function get_genbank($assembly_name, $assembly_accession, $stats = FALSE) {
  $genbank = new stdClass();
  $genbank->assembly_name = $assembly_name;
  $genbank->assembly_accession = $assembly_accession;
  $url = 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/';
  if (isset($assembly_name) && !empty($assembly_name) && isset($assembly_accession) && !empty($assembly_accession)) {
    $parts = explode('_', $assembly_accession);
    $folder_0 = $parts[0];
    $folder_1 = substr($parts[1], 0, 3);
    $folder_2 = substr($parts[1], 3, 3);
    $folder_3 = substr($parts[1], 6, 3);
    $url .= $folder_0.'/'.$folder_1.'/'.$folder_2.'/'.$folder_3.'/'.$assembly_accession.'_'.$assembly_name.'/';
    $genbank->url = $url;
    $genbank->file_prefix = $assembly_accession.'_'.$assembly_name."_";
    //////////////////////////////////////////////////////////////////////
    // FIND CDS FROME GENOMIC FILE ///////////////////////////////////////
    if (file_exists($genbank->url.$genbank->file_prefix."cds_from_genomic.fna.gz")) {
      $genbank->cds_from_genomic_url = $genbank->url.$genbank->file_prefix."cds_from_genomic.fna.gz";
    } // end if
    //////////////////////////////////////////////////////////////////////
    // FIND FEATURE TABLE FILE ///////////////////////////////////////////
    if (file_exists($genbank->url.$genbank->file_prefix."feature_table.txt.gz")) {
      $genbank->feature_table_url = $genbank->url.$genbank->file_prefix."feature_table.txt.gz";
    } // end if
    //////////////////////////////////////////////////////////////////////
    // FIND GENOME SEQUENCE FILE /////////////////////////////////////////
    if (file_exists($genbank->url.$genbank->file_prefix."genomic.fna.gz")) {
      $genbank->genome_url = $genbank->url.$genbank->file_prefix."genomic.fna.gz";
    } // end if
    //////////////////////////////////////////////////////////////////////
    // FIND PROTEIN SEQUENCE FILE ////////////////////////////////////////
    if (file_exists($genbank->url.$genbank->file_prefix."protein.faa.gz")) {
      if (filesize($genbank->url.$genbank->file_prefix."protein.faa.gz") > 2700) {
        $genbank->proteome_url = $genbank->url.$genbank->file_prefix."protein.faa.gz";
      } // end if
    } // end if
    //////////////////////////////////////////////////////////////////////
    // FIND TRANSLATED CDS FILE //////////////////////////////////////////
    if (file_exists($genbank->url.$genbank->file_prefix."translated_cds.faa.gz")) {
      $genbank->translated_cds_url = $genbank->url.$genbank->file_prefix."translated_cds.faa.gz";
    } // end if
    //////////////////////////////////////////////////////////////////////
    // READ ASSEMBLY STATS FILE //////////////////////////////////////////
    if ($stats && file_exists($genbank->url.$genbank->file_prefix."assembly_stats.txt")) {
      $temp_filename = GUIDv4().".txt";
      if (copy($genbank->url.$genbank->file_prefix."assembly_stats.txt", $_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename)) {
        if ($file = fopen($_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename, "r")) {
          $line_number = 0;
          while(!feof($file)) {
            $line = fgets($file);
            $line_number++;
            if ($line_number > 50) { break; }
            $line = str_replace(array("\n\r", "\n", "\r"), '', $line);
            if ($line == "#") { break; }
            if (strpos($line, ':') !== false) {
              $parts = explode(':', $line);
              $key = preg_replace('/\s+/', '_', $parts[0]);
              $key = str_replace('"', '', $key);
              $key = strtolower(trim(str_replace("#_", "", $key)));
              if (isset($parts[1]) && !empty($parts[1])) {
                $parts[1] = str_replace('"', '', $parts[1]);
                $genbank->$key = trim($parts[1]);
              } // end if
            } // end if
          } // end while
          fclose($file);
          unlink($_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename);
        } // end if open file
      } // end if copy file
    } // end if file_exists
  } // end if arguments are valid
  return $genbank;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function get_genbank_all($assembly_name, $assembly_accession, $stats = FALSE) {
  $genbank = new stdClass();
  $genbank->records = [];
  $url = 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/';
  if (isset($assembly_name) && !empty($assembly_name) && isset($assembly_accession) && !empty($assembly_accession)) {
    $parts = explode('_', $assembly_accession);
    $folder_0 = $parts[0];
    $folder_1 = substr($parts[1], 0, 3);
    $folder_2 = substr($parts[1], 3, 3);
    $folder_3 = substr($parts[1], 6, 3);
    $url .= $folder_0.'/'.$folder_1.'/'.$folder_2.'/'.$folder_3.'/';
    $dir_contents = scandir($url);
    krsort($dir_contents);
    for ($i = 0; $i < count($dir_contents); $i++) {
      $record = new stdClass();
      $record->url = $url.$dir_contents[$i].'/';
      $parts = explode('_', $dir_contents[$i]);
      if ($parts[1]) { $record->assembly_accession = $parts[0]."_".$parts[1]; }
      $record->assembly_name = "";
      for ($j = 2; $j < count($parts); $j++) {
        if ($j > 2) { $record->assembly_name .= "_"; }
        $record->assembly_name .= $parts[$j];
      } // end for loop
      $record->file_prefix = $record->assembly_accession.'_'.$record->assembly_name."_";
      //////////////////////////////////////////////////////////////////////
      // FIND CDS FROME GENOMIC FILE ///////////////////////////////////////
      if (file_exists($record->url.$record->file_prefix."cds_from_genomic.fna.gz")) {
        $record->cds_from_genomic_url = $record->url.$record->file_prefix."cds_from_genomic.fna.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND FEATURE TABLE FILE ///////////////////////////////////////////
      if (file_exists($record->url.$record->file_prefix."feature_table.txt.gz")) {
        $record->feature_table_url = $record->url.$record->file_prefix."feature_table.txt.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND GENOME SEQUENCE FILE /////////////////////////////////////////
      if (file_exists($record->url.$record->file_prefix."genomic.fna.gz")) {
        $record->genome_url = $record->url.$record->file_prefix."genomic.fna.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND PROTEIN SEQUENCE FILE ////////////////////////////////////////
      if (file_exists($record->url.$record->file_prefix."protein.faa.gz")) {
        if (filesize($record->url.$record->file_prefix."protein.faa.gz") > 2700) {
          $record->proteome_url = $record->url.$record->file_prefix."protein.faa.gz";
        } // end if
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND TRANSLATED CDS FILE //////////////////////////////////////////
      if (file_exists($record->url.$record->file_prefix."translated_cds.faa.gz")) {
        $record->translated_cds_url = $record->url.$record->file_prefix."translated_cds.faa.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // READ ASSEMBLY STATS FILE //////////////////////////////////////////
      if ($stats && file_exists($record->url.$record->file_prefix."assembly_stats.txt")) {
        $temp_filename = GUIDv4().".txt";
        if (copy($record->url.$record->file_prefix."assembly_stats.txt", $_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename)) {
          if ($file = fopen($_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename, "r")) {
            $line_number = 0;
            while(!feof($file)) {
              $line = fgets($file);
              $line_number++;
              if ($line_number > 50) { break; }
              $line = str_replace(array("\n\r", "\n", "\r"), '', $line);
              if ($line == "#") { break; }
              if (strpos($line, ':') !== false) {
                $parts = explode(':', $line);
                $key = preg_replace('/\s+/', '_', $parts[0]);
                $key = str_replace('"', '', $key);
                $key = strtolower(trim(str_replace("#_", "", $key)));
                if (isset($parts[1]) && !empty($parts[1])) {
                  $parts[1] = str_replace('"', '', $parts[1]);
                  $record->$key = trim($parts[1]);
                } // end if
              } // end if
            } // end while
            fclose($file);
            unlink($_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename);
          } // end if open file
        } // end if copy file
      } // end if file_exists
      $genbank->records[] = $record;
    } // end for loop
  } // end if arguments are valid
  return $genbank;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function get_more_information($record = NULL) {
  $assembly_accession = "";
  $bioproject = "";
  $biosample = "";
  if (isset($record) && !empty($record)) {
    if (isset($record->assembly_accession) && !empty($record->assembly_accession)) { $assembly_accession = "?term=".$record->assembly_accession; }
    if (isset($record->bioproject) && !empty($record->bioproject)) { $bioproject = "?term=".$record->bioproject; }
    if (isset($record->biosample) && !empty($record->biosample)) { $biosample = "?term=".$record->biosample; }
  } // end if
  $info = new stdClass();
  $info->assembly_level = 'The <b>assembly level</b> gives additional information about the degree of genome sequence construction, and can have one of the following values:<br><br><dl><dt>Contig</dt><dd>A <i>contig</i> is a contiguous DNA sequence built by connecting shorter overlapping DNA sequences.  For a genome with this assembly level, nothing is assembled beyond the level of sequence <i>contigs</i>.</dd><br><dt>Scaffold</dt><dd>A <i>scaffold</i> is a DNA sequence that has been constructed by ordering and orienting <i>contigs</i>.  A <i>scaffold</i> will still contain gaps in the sequence, but there exists evidence to support the ordering and placement of the <i>contigs</i>.</dd><br><dt>Chromosome<dt><dd>The genome sequence contains the sequence of one or more chromosomes. These chromosomes could be a completely sequenced without gaps, or contain <i>scaffolds</i> or <i>contigs</i> with gaps between them. There may also be DNA sequences for which a location has not been determined.</dd><br><dt>Complete genome</dt><dd>For a genome sequence to be regarded as <i>complete</i>, all chromosome must to represented by the sequence, be free of gaps, and have no undetermined portions of the sequence longer than 10 nucleotides.  (Undetermined or ambiguous nucleotides are represented by the letter <i>N</i> within a sequence.)  There also must be no sequences that lack a known location within the overall genome.  Additional DNA sequences from intracellular components may be present however, such as the DNA of mitochondria, chloroplasts, and plasmids, so long as these sequences lack gaps.</dd></dl>';
  $info->assembly_method = 'The software algorithm used for assembling the genome sequence.';
  $info->assembly_type = 'The <b>assembly type</b> gives additional information about the sequenced genome, and can have one of the following values:<br><br><dl><dt><b>diploid</b></dt><dd>Diploid organisms have two sets of chromosomes.  A diploid assembly is an assembled genome that has sequences available for both sets of the organism’s chromosomes.  When this value is given, it is assumed that the DNA came from a single individual.</dd><br><dt><b>haploid</b></dt><dd>A haploid assembly is an assembled genome that has sequences available for only one set of chromosomes.  The DNA may have come from one or more individuals.</dd><br><dt><b>haploid-with-alt-loci</b></dt><dd>This value indicates a haploid assembly, but with additional DNA sequences provided as alternate sequences for some locations.</dd><br><dt><b>unresolved diploid</b></dt><dd>This value indicates a diploid assembly, but where the DNA sequences have not been separated into both sets.  As such, DNA sequences may appear repeated.</dd><br><dt><b>principal pseudohaplotype</b> or <b>alternate pseudohaplotype</b></dt><dd>These values indicate that the genome is from a diploid organism, but the true sequence of each chromosome has not been determined.  Instead, parts of chromosome sequences are arbitrarily assigned to either a <i>principal chromosome</i> or an <i>alternate chromosome</i>, creating a "pseudo-diploid" genome sequence.</dd></dl>';
  $info->bioproject = 'A <b>BioProject</b> is a collection of biological data related to a single initiative, originating from a single organization or from a consortium of coordinating organizations.  Each BioProject is assigned an unique <b>BioProject ID</b> by the NCBI before sequencing information can be submitted. '.create_external_link("NCBI BioProject Database", "https://www.ncbi.nlm.nih.gov/bioproject/".$bioproject);
  $info->biosample = 'A <b>BioSample ID</b> is a unique identifier given to a biological sample.  More information regarding the specific biological material used for genome sequencing for this project may be found through the NCBI BioSample database. '.create_external_link("NCBI Genome Database", "https://www.ncbi.nlm.nih.gov/biosample".$biosample);
  $info->coverage = 'When determining the DNA sequence of a genome, the nucleotide at each position often will be read more than once.  The number of times a given nucleotide is read is its <b>coverage</b>.  The <b>genome coverage</b> is the average nucleotide coverage for the entire genome, and can calculated as <i>N</i> &times; <i>L</i> &divide; <i>G</i>, where <i>G</i> is the length of the genome, <i>N</i> is the number of shorter DNA segments that were read to construct the genome sequence, and <i>L</i> is the average length of these shorter segments, with all lengths as the number of nucleotides.  High coverage is a good indication of the accuracy of the resulting DNA sequence, and "clinical-grade" DNA sequencing used for human medical or diagnostic purposes is currently assumed to be at least 30X.';
  $info->genbank_accession = 'All GenBank accession numbers begin with the letters "GCA" followed by an underscore symbol.<br><br>An <b>accession number</b> is a unique identifier assigned to an item in a collection, such as a book, painting, or museum artifact.  In bioinformatics, an accession number is a unique identifier assigned to a database entry. '.create_external_link("NCBI Genome Database", "https://www.ncbi.nlm.nih.gov/genome/".$assembly_accession);
  $info->genome_representation = '<b>Genome representation</b> indicates what portion of the genome was used for generating the overall sequence, and can have one of the following values:<br><br><dl><dt>Full</dt><dd>The DNA was obtained from the entire genome, however there may still be gaps in the assembled sequence.</dd><br><dt>Partial</dt><dd>The DNA came from only part of the genome. The majority of sequenced genomes have full genome representation with only a minority being designated as <i>partial</i>.</dd></dl>';
  $info->project_accession = "An <b>accession number</b> is a unique identifier assigned to an item in a collection, such as a book, painting, or museum artifact.  In bioinformatics, an accession number is a unique identifier assigned to a database entry. ".create_external_link("NCBI Genome Database", "https://www.ncbi.nlm.nih.gov/genome/".$assembly_accession);
  $info->reference_guided_assembly = 'During the process of assembling a genome-level DNA sequence, another genome may be used as a point of reference, or the assembly process may proceed <i>de-novo</i> (without a reference).';
  $info->refseq_accession = 'All reference sequence accession numbers begin with the letter "GCF" followed by an underscore symbol.<br><br>An <b>accession number</b> is a unique identifier assigned to an item in a collection, such as a book, painting, or museum artifact.  In bioinformatics, an accession number is a unique identifier assigned to a database entry. '.create_external_link("NCBI BioSample Database", "https://www.ncbi.nlm.nih.gov/genome/".$assembly_accession);
  $info->sequencing_technology = 'The type of physical machine used for reading and assembling the genome sequence.';
  $info->status = "A <b>draft sequence</b> is a DNA sequence that is not in a finished form, but is of overall high quality (greater than 90% accuracy).  Draft sequences usually consist of sequenced DNA fragments up to 10,000 base pairs in length, each with known approximate chromosomal locations.  Draft sequences often have 0X to 4X coverage, meaning that each specific base pair has been identified during sequencing up to 4 times.<br>A <b>complete sequence</b> is a DNA sequence of extremely high quality that is free of gaps.  Complete sequences often have 8X coverage or higher, meaning that each specific base pair has been identified during sequencing at least 8 times.";
  $info->taxid = "The <b>taxonomic ID (taxid)</b> is the identification number used by the NCBI to identify this specific genus and species.";
  $info->uid = "The <b>Universal ID (uid)</b> is the unique NCBI identifying number given to the genome record.";
  return $info;
} // end class
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function get_refSeq($taxid, $stats = FALSE) {
  $refseq = new stdClass();
  if (isset($taxid) && !empty($taxid)) {
    $refseq_dir = '';
    $max_arn = 0;
    $url = 'ftp://ftp.ncbi.nlm.nih.gov/genomes/all/annotation_releases/';
    $url .= $taxid.'/';
    if (file_exists($url) || is_dir($url)) {
      $refseq->url = $url;
      $arn_contents = scandir($refseq->url);
      for ($i = 0; $i < count($arn_contents); $i++) {
        if ($arn_contents[$i] > $max_arn) {
          $max_arn = $arn_contents[$i];
        } // end if
      } // end for loop
      $refseq->annotation_release_number = $max_arn;
      $refseq->url .= $refseq->annotation_release_number.'/';
      $dir_contents = scandir($refseq->url);
      for ($i = 0; $i < count($dir_contents); $i++) {
        if (substr($dir_contents[$i], 0, 4 ) === "GCF_") {
          $refseq_dir = $dir_contents[$i];
        } // end if
      } // end for loop
      $refseq->url .= $refseq_dir.'/';
      $parts = explode('_', $refseq_dir);
      $refseq->assembly_accession = $parts[0]."_".$parts[1];
      $refseq->assembly_name = "";
      for ($i = 2; $i < count($parts); $i++) {
        if ($i > 2) { $refseq->assembly_name .= "_"; }
        $refseq->assembly_name .= $parts[$i];
      } // end for loop
      $refseq->file_prefix = $refseq_dir."_";
      //////////////////////////////////////////////////////////////////////
      // FIND CDS FROME GENOMIC FILE ///////////////////////////////////////
      if (file_exists($refseq->url.$refseq->file_prefix."cds_from_genomic.fna.gz")) {
        $refseq->cds_from_genomic_url = $refseq->url.$refseq->file_prefix."cds_from_genomic.fna.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND FEATURE TABLE FILE ///////////////////////////////////////////
      if (file_exists($refseq->url.$refseq->file_prefix."feature_table.txt.gz")) {
        $refseq->feature_table_url = $refseq->url.$refseq->file_prefix."feature_table.txt.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND GENOME SEQUENCE FILE /////////////////////////////////////////
      if (file_exists($refseq->url.$refseq->file_prefix."genomic.fna.gz")) {
        $refseq->genome_url = $refseq->url.$refseq->file_prefix."genomic.fna.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND PROTEIN SEQUENCE FILE ////////////////////////////////////////
      if (file_exists($refseq->url.$refseq->file_prefix."protein.faa.gz")) {
        $refseq->proteome_url = $refseq->url.$refseq->file_prefix."protein.faa.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // FIND TRANSLATED CDS FILE //////////////////////////////////////////
      if (file_exists($refseq->url.$refseq->file_prefix."translated_cds.faa.gz")) {
        $refseq->translated_cds_url = $refseq->url.$refseq->file_prefix."translated_cds.faa.gz";
      } // end if
      //////////////////////////////////////////////////////////////////////
      // READ ASSEMBLY STATS FILE //////////////////////////////////////////
      if ($stats && file_exists($refseq->url.$refseq->file_prefix."assembly_stats.txt")) {
        $temp_filename = GUIDv4().".txt";
        if (copy($refseq->url.$refseq->file_prefix."assembly_stats.txt", $_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename)) {
          if ($file = fopen($_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename, "r")) {
            $line_number = 0;
            while(!feof($file)) {
              $line = fgets($file);
              $line_number++;
              if ($line_number > 50) { break; }
              $line = str_replace(array("\n\r", "\n", "\r"), '', $line);
              if ($line === "#") { break; }
              if (strpos($line, ':') !== false) {
                $parts = explode(':', $line);
                $key = preg_replace('/\s+/', '_', $parts[0]);
                $key = str_replace('"', '', $key);
                $key = strtolower(trim(str_replace("#_", "", $key)));
                if (isset($parts[1]) && !empty($parts[1])) {
                  $parts[1] = str_replace('"', '', $parts[1]);
                  $refseq->$key = trim($parts[1]);
                } // end if
              } // end if
            } // end while
            fclose($file);
            unlink($_SERVER['DOCUMENT_ROOT']."/temporary/".$temp_filename);
          } // if file open
        } // end if copy file
      } // end if file exists
    } // end if directory exists
  } // end if arguments are valid
  return $refseq;
} // end function
///////////////////////////////////////////////////////////////////////////////
?>
