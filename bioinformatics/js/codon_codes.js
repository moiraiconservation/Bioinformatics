///////////////////////////////////////////////////////////////////////////////////////////////////
// STANDARD VERTEBRATE NUCLEAR CODON CODE /////////////////////////////////////////////////////////
let codon_vert = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',

    'GCN': 'A', 'CGN': 'R', 'AAY': 'N', 'GAY': 'D',
    'TGY': 'C', 'CAR': 'Q', 'GAR': 'E', 'GGN': 'G',
    'CAY': 'H', 'ATH': 'I', 'CTN': 'L', 'AAR': 'K',
    'TTY': 'F', 'CCN': 'P', 'TCN': 'S', 'ACN': 'T',
    'TAY': 'Y', 'GTN': 'V', 'AGR': 'R', 'TTR': 'L',
    'AGY': 'S', 'TRA': '*'
}; // end object
///////////////////////////////////////////////////////////////////////////////////////////////////
// THE STANDARD VERTEBRATE MITOCHONDRIAL CODON CODE ///////////////////////////////////////////////
let codon_vert_mito = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'M', 'ATG': 'M',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'TGT': 'C', 'TGC': 'C', 'TGA': 'W', 'TGG': 'W',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'AGT': 'S', 'AGC': 'S', 'AGA': '*', 'AGG': '*',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
}; // end object
///////////////////////////////////////////////////////////////////////////////////////////////////

function reverse_complement(dna) {
    let new_letter = '';
    let new_dna = '';
    dna = dna.toUpperCase();
    for (let i = (dna.length - 1); i > -1; i--) {
        let letter = dna.charAt(i);
        switch (letter.toUpperCase()) {
            case 'A': { new_letter = 'T'; break; }
            case 'C': { new_letter = 'G'; break; }
            case 'G': { new_letter = 'C'; break; }
            case 'T': { new_letter = 'A'; break; }
            case 'R': { new_letter = 'Y'; break; }
            case 'Y': { new_letter = 'R'; break; }
            case 'S': { new_letter = 'W'; break; }
            case 'W': { new_letter = 'S'; break; }
            case 'K': { new_letter = 'M'; break; }
            case 'M': { new_letter = 'K'; break; }
            case 'B': { new_letter = 'V'; break; }
            case 'V': { new_letter = 'B'; break; }
            case 'D': { new_letter = 'H'; break; }
            case 'H': { new_letter = 'D'; break; }
            default: { new_letter = 'N'; break; }
        } // end switch
        if (letter === letter.toLowerCase()) { new_letter = new_letter.toLowerCase(); }
        new_dna += new_letter;
    } // end for loop
    return new_dna;
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function translate(dna, start, codon_code) {
    if (typeof(start) === 'undefined') { start = 0; }
    if (typeof(codon_code) === 'undefined') { codon_code = codon_vert; }
    let protein = '';
    for (let i = start; i < dna.length; i = i + 3) {
        if ((i + 3) <= dna.length) {
            let codon = dna.substring(i, i + 3);
            let amino_acid = codon_code[codon.toUpperCase()];
            if (typeof(amino_acid) === 'undefined') { amino_acid = 'X'; }
            if (/[a-z]/.test(codon)) { amino_acid = amino_acid.toLowerCase(); }
            protein += amino_acid;
        } // end if
    } // end for loop
    return protein;
} // ned function

///////////////////////////////////////////////////////////////////////////////////////////////////

function translate_all_six_frames(dna, codon_code) {
    if (typeof(codon_code) === 'undefined') { codon_code = codon_vert; }
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

///////////////////////////////////////////////////////////////////////////////////////////////////
