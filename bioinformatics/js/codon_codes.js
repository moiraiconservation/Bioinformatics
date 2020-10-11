///////////////////////////////////////////////////////////////////////////////
// STANDARD VERTEBRATE NUCLEAR CODON CODE /////////////////////////////////////
let codon_vert = {
  "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L",
  "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
  "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M",
  "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
  "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S",
  "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
  "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T",
  "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
  "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*",
  "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
  "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K",
  "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
  "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W",
  "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
  "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R",
  "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
  "GCN": "A", "CGN": "R", "AAY": "N", "GAY": "D", // compressed
  "TGY": "C", "CAR": "Q", "GAR": "E", "GGN": "G", // compressed
  "CAY": "H", "ATH": "I", "CTN": "L", "AAR": "K", // compressed
  "TTY": "F", "CCN": "P", "TCN": "S", "ACN": "T", // compressed
  "TAY": "Y", "GTN": "V", "AGR": "R", "TTR": "L", // compressed
  "AGY": "S", "TRA": "*"                          // compressed
}; // end object
let reverse_codon_vert = {
  "A": [ "GCN" ],
  "C": [ "TGY" ],
  "D": [ "GAY" ],
  "E": [ "GAR" ],
  "F": [ "TTY" ],
  "G": [ "GGN" ],
  "H": [ "CAY" ],
  "I": [ "ATH" ],
  "K": [ "AAR" ],
  "L": [ "CTN", "TTR" ],
  "M": [ "ATG" ],
  "N": [ "AAY" ],
  "P": [ "CCN" ],
  "Q": [ "CAR" ],
  "R": [ "CGN", "AGR" ],
  "S": [ "TCN", "AGY" ],
  "T": [ "ACN" ],
  "V": [ "GTN" ],
  "W": [ "TGG" ],
  "Y": [ "TAY" ],
}; // end object
///////////////////////////////////////////////////////////////////////////////
// THE STANDARD VERTEBRATE MITOCHONDRIAL CODON CODE ///////////////////////////
let codon_vert_mito = {
  "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L",
  "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
  "ATT": "I", "ATC": "I", "ATA": "M", "ATG": "M",
  "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
  "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S",
  "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
  "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T",
  "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
  "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*",
  "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
  "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K",
  "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
  "TGT": "C", "TGC": "C", "TGA": "W", "TGG": "W",
  "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
  "AGT": "S", "AGC": "S", "AGA": "*", "AGG": "*",
  "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G"
}; // end object
///////////////////////////////////////////////////////////////////////////////
function compress_alphabet(dna) {
  let new_letter = "";
  let new_dna = "";
  dna = dna.toUpperCase();
  for (let i = 0; i < dna.length; i++) {
    let letter = dna.charAt(i);
    switch (letter.toUpperCase()) {
      case "A": { new_letter = "W"; break; }
      case "C": { new_letter = "S"; break; }
      case "G": { new_letter = "S"; break; }
      case "T": { new_letter = "W"; break; }
      case "S": { new_letter = "S"; break; }
      case "W": { new_letter = "W"; break; }
      default: { new_letter = "n"; break; }
    } // end switch
    if (letter === letter.toLowerCase()) { new_letter = new_letter.toLowerCase(); }
    new_dna += new_letter;
  } // end for loop
  return new_dna;
} // end function
///////////////////////////////////////////////////////////////////////////////
function reverse_complement(dna) {
  let new_letter = "";
  let new_dna = "";
  dna = dna.toUpperCase();
  for (let i = (dna.length - 1); i > -1; i--) {
    let letter = dna.charAt(i);
    switch (letter.toUpperCase()) {
      case "A": { new_letter = "T"; break; }
      case "C": { new_letter = "G"; break; }
      case "G": { new_letter = "C"; break; }
      case "T": { new_letter = "A"; break; }
      case "R": { new_letter = "Y"; break; }
      case "Y": { new_letter = "R"; break; }
      case "S": { new_letter = "W"; break; }
      case "W": { new_letter = "S"; break; }
      case "K": { new_letter = "M"; break; }
      case "M": { new_letter = "K"; break; }
      case "B": { new_letter = "V"; break; }
      case "V": { new_letter = "B"; break; }
      case "D": { new_letter = "H"; break; }
      case "H": { new_letter = "D"; break; }
      default: { new_letter = "N"; break; }
    } // end switch
    if (letter === letter.toLowerCase()) { new_letter = new_letter.toLowerCase(); }
    new_dna += new_letter;
  } // end for loop
  return new_dna;
} // end function
///////////////////////////////////////////////////////////////////////////////
function translate(dna, start, codon_code) {
  if (typeof(start) === "undefined") { start = 0; }
  if (typeof(codon_code) === "undefined") { codon_code = codon_vert; }
  let protein = "";
  for (let i = start; i < dna.length; i = i + 3) {
    if ((i + 3) <= dna.length) {
      let codon = dna.substring(i, i + 3);
      let amino_acid = codon_code[codon.toUpperCase()];
      if (typeof(amino_acid) === "undefined") { amino_acid = "X"; }
      if (/[a-z]/.test(codon)) { amino_acid = amino_acid.toLowerCase(); }
      protein += amino_acid;
    } // end if
  } // end for loop
  return protein;
} // ned function
///////////////////////////////////////////////////////////////////////////////
function translate_all_six_frames(dna, codon_code) {
  if (typeof(codon_code) === "undefined") { codon_code = codon_vert; }
  let translations = [];
  let rc_dna = reverse_complement(dna);
  translations.push(translate(dna, 0, codon_code));
  translations.push(translate(dna, 1, codon_code));
  translations.push(translate(dna, 2, codon_code));
  translations.push(translate(rc_dna, 0, codon_code));
  translations.push(translate(rc_dna, 1, codon_code));
  translations.push(translate(rc_dna, 2, codon_code));
  return translations;
} // end function
///////////////////////////////////////////////////////////////////////////////
function reverse_translate(protein, codon_code) {
  let dna = ["", ""];
  for (let i = 0; i < protein.length; i++) {
    let codon_options = reverse_codon_vert[protein[i]];
    dna[0] += codon_options[0];
    if (codon_options[1]) { dna[1] += codon_options[1]; }
    else { dna[1] += codon_options[0]; }
  } // end for loop
  return dna;
} // end function
///////////////////////////////////////////////////////////////////////////////
function decompress_dna(dna) {
  let sequences = []; sequences.push("");
  for (let i = 0; i < dna.length; i ++) {
    let letter = dna[i];
    let new_sequences = [];
    switch(letter) {
      case "A": { for (let j = 0; j < sequences.length; j++) { sequences[j] += "A"; } break; }
      case "C": { for (let j = 0; j < sequences.length; j++) { sequences[j] += "C"; } break; }
      case "G": { for (let j = 0; j < sequences.length; j++) { sequences[j] += "G"; } break; }
      case "T": { for (let j = 0; j < sequences.length; j++) { sequences[j] += "T"; } break; }
      case "U": { for (let j = 0; j < sequences.length; j++) { sequences[j] += "U"; } break; }
      case "W": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "S": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "C");
          new_sequences.push(sequences[j] + "G");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "M": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "C");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "K": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "G");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "R": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "G");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "Y": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "C");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "B": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "C");
          new_sequences.push(sequences[j] + "G");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "D": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "G");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "H": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "C");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "V": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "C");
          new_sequences.push(sequences[j] + "G");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      case "N": {
        for (let j = 0; j < sequences.length; j++) {
          new_sequences.push(sequences[j] + "A");
          new_sequences.push(sequences[j] + "C");
          new_sequences.push(sequences[j] + "G");
          new_sequences.push(sequences[j] + "T");
        } // end for loop
        delete sequences;
        sequences = new_sequences;
        break;
      } // end case
      default: { break; }
    } // end switch
  } // end for loop
  return sequences;
} // end function
///////////////////////////////////////////////////////////////////////////////
