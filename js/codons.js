///////////////////////////////////////////////////////////////////////////////
// codons.js //////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function CODONS() {
	////////////////////////////////////////////////////////////////////////
	// MEMBER VARIABLES ////////////////////////////////////////////////////
	const extended_nucleotide_set = ['A', 'T', 'C', 'G', 'R', 'Y', 'S', 'W', 'K', 'M', 'B', 'D', 'H', 'V', 'N'];
	const extended_codon_set = all_codons();
	////////////////////////////////////////////////////////////////////////
	// STANDARD VERTEBRATE NUCLEAR CODON CODE //////////////////////////////
	this.vertebrate = {
		forward: {
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
		},
		//////////////////////////////////////////////////////////////////////
		reverse: {
			'A': ['GCN', 'GCT', 'GCC', 'GCA', 'GCG'],
			'B': ['RAY', 'AAT', 'AAC', 'GAT', 'GAC'],
			'C': ['TGY', 'TGT', 'TGC'],
			'D': ['GAY', 'GAT', 'GAC'],
			'E': ['GAR', 'GAA', 'GAG'],
			'F': ['TTY', 'TTT', 'TTC'],
			'G': ['GGN', 'GGT', 'GGC', 'GGA', 'GGG'],
			'H': ['CAY', 'CAT', 'CAC'],
			'I': ['ATH', 'ATT', 'ATC', 'ATA'],
			'J': ['ATH', 'ATT', 'ATC', 'ATA', 'CTN', 'TTR', 'CTY', 'YTR', 'CTT', 'CTC', 'CTA', 'CTG', 'TTA', 'TTG'],
			'K': ['AAR', 'AAA', 'AAG'],
			'L': ['CTN', 'TTR', 'CTY', 'YTR', 'CTT', 'CTC', 'CTA', 'CTG', 'TTA', 'TTG'],
			'M': ['ATG'],
			'N': ['AAY', 'AAT', 'AAC'],
			'O': ['TAG'],
			'P': ['CCN', 'CCT', 'CCC', 'CCA', 'CCG'],
			'Q': ['CAR', 'CAA', 'CAG'],
			'R': ['CGN', 'AGR', 'CGY', 'MGR', 'CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
			'S': ['TCN', 'AGY', 'TCT', 'TCC', 'TCA', 'TCG', 'AGT', 'AGC'],
			'T': ['ACN', 'ACT', 'ACC', 'ACA', 'ACG'],
			'U': ['TGA'],
			'V': ['GTN', 'GTT', 'GTC', 'GTA', 'GTG'],
			'W': ['TGG'],
			'Y': ['TAY', 'TAT', 'TAC'],
			'Z': ['SAR', 'CAA', 'CAG', 'GAA', 'GAG']
		},
		start: ['ATG'],
		stop: ['TAA', 'TGA', 'TAG']
	};
	////////////////////////////////////////////////////////////////////////
	// THE STANDARD VERTEBRATE MITOCHONDRIAL CODON CODE ////////////////////
	this.mitochondrial = {
		forward: {
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
		}
	}; // end object
	////////////////////////////////////////////////////////////////////////
	// PRIVATE METHOD //////////////////////////////////////////////////////
	function all_codons() {
		let codons = [];
		for (let a = 0; a < extended_nucleotide_set.length; a++) {
			for (let b = 0; b < extended_nucleotide_set.length; b++) {
				for (let c = 0; c < extended_nucleotide_set.length; c++) {
					let codon = extended_nucleotide_set[a] + extended_nucleotide_set[b] + extended_nucleotide_set[c];
					codons.push(codon);
				}
			}
		}
		return codons;
	}
	////////////////////////////////////////////////////////////////////////
}
///////////////////////////////////////////////////////////////////////////////
