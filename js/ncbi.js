///////////////////////////////////////////////////////////////////////////////
// ncbi.js ////////////////////////////////////////////////////////////////////
//===========================================================================//
// Notes:                                                                    //
// 	Requires elements.js and wrappers.js                                     //
//===========================================================================//
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function NCBI() {
	////////////////////////////////////////////////////////////////////////
	// MEMBER VARIABLES ////////////////////////////////////////////////////
	function ASSETS() {
		this.cds = '';
		this.feature_count = '';
		this.feature_table = '';
		this.genome = '';
		this.proteome = '';
		this.report = '';
		this.rna = '';
		this.root = '';
		this.stats = '';
		this.translated_cds = '';
	}
	const element = new ELEMENT();
	function SCRAPE_RESULT() {
		this.completed = false;
		this.failed = 0;
		this.genbank = 0;
		this.refseq = 0;
		this.scraped = 0;
		this.total_records = 0;
	}
	let scrape_start = 0;
	const wrapper = new WRAPPER();
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.guid = () => {
		function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
		return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.scrape = () => {
		return new Promise((resolve) => {
			let sql = "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ncbi'";
			element.show_spinner();
			wrapper.sqlite3_all(sql)
			.then((rows) => {
				if (!rows.length) {
					sql = 'CREATE table ncbi (';
					sql += 'uid TEXT NOT NULL PRIMARY KEY, ';
					sql += 'assembly_accession TEXT NOT NULL, ';
					sql += 'assembly_id TEXT NOT NULL, ';
					sql += 'assembly_name TEXT NOT NULL, ';
					sql += 'genbank_urls TEXT NOT NULL, ';
					sql += 'refseq_urls TEXT NOT NULL, ';
					sql += 'organism TEXT NOT NULL, ';
					sql += 'taxid TEXT NOT NULL';
					sql += ')';
					wrapper.sqlite3_run(sql).then(() => { scrape_eukaryotes().then((scrape_result) => { return resolve(scrape_result); }); });
				}
				else { scrape_eukaryotes().then((scrape_result) => { return resolve(scrape_result); }); }
			});
		});
		/////////////////////////////////////////////////////
		// METHOD FUNCTION //////////////////////////////////
		function scrape_assets(record, index) {
			return new Promise((resolve) => {
				if (!index) { index = 0; }
				if (index >= record.length) { return resolve(record); }
				scrape_directory(record[index].root)
				.then((directory) => {
					for (let i = 0; i < directory.length; i++) {
						if (directory[i].includes('cds_from_genomic.fna.gz')) { record[index].cds = directory[i]; }
						if (directory[i].includes('feature_count.txt.gz')) { record[index].feature_count = directory[i]; }
						if (directory[i].includes('feature_table.txt.gz')) { record[index].feature_table = directory[i]; }
						if (directory[i].includes('genomic.fna.gz')) { record[index].genome = directory[i]; }
						if (directory[i].includes('protein.faa.gz')) { record[index].proteome = directory[i]; }
						if (directory[i].includes('report.txt')) { record[index].report = directory[i]; }
						if (directory[i].includes('rna_from_genomic.fna.gz')) { record[index].rna = directory[i]; }
						if (directory[i].includes('stats.txt')) { record[index].stats = directory[i]; }
						if (directory[i].includes('translated_cds.faa.gz')) { record[index].translated_cds = directory[i]; }
					}
					scrape_assets(record, index + 1).then((result) => { return resolve(result); });
				});
			});
		}
		/////////////////////////////////////////////////////
		// METHOD FUNCTION //////////////////////////////////
		function scrape_directory(url) {
			return new Promise((resolve) => {
				const directory = [];
				wrapper.axios_get(url)
				.then((html) => {
					if (html) {
						const dom = document.createElement('html');
						dom.innerHTML = html;
						const links = dom.getElementsByTagName('a');
						for (let i = 0; i < links.length; i++) {
							const title = links[i].innerHTML;
							if (title !== 'Parent Directory') {
								directory.push(links[i].getAttribute('href'));
							}
						}
						directory.sort((a, b) => {
							if (a > b) { return -1; }
							if (a < b) { return 1; }
							return 0;
						});
					}
					return resolve(directory);
				});
			});
		}
		/////////////////////////////////////////////////////
		// METHOD FUNCTION //////////////////////////////////
		function scrape_eukaryotes() {
			return new Promise((resolve) => {
				const config = { headers: { "Content-Type": "application/x-www-form-urlencoded" } };
				const data = {
					api_key: app_storage.api_keys.ncbi,
					db: 'genome',
					term: 'eukaryota',
					retmax: '100000',
					retmode: 'json'
				};
				const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
				wrapper.axios_post(config, data, url)
				.then((result) => {
					const scrape_result = new SCRAPE_RESULT();
					scrape_result.total_records = result.esearchresult.idlist.length;
					element.hide_spinner();
					element.show_progress_bar('Scraping NCBI Database', scrape_start, result.esearchresult.idlist.length);
					scrape_next(result.esearchresult.idlist, scrape_start, scrape_result).then((scrape_result) => { return resolve(scrape_result); });
				});
			});
		}
		/////////////////////////////////////////////////////
		// METHOD FUNCTION //////////////////////////////////
		function scrape_next(id_list, index, scrape_result) {
			return new Promise((resolve) => {
				scrape_result.scraped = index;
				if (index < id_list.length) {
					scrape_start = index;
					const config = { headers: { "Content-Type": "application/x-www-form-urlencoded" } };
					const data = {
						api_key: app_storage.api_keys.ncbi,
						db: 'genome',
						id: id_list[index],
						retmode: 'json'
					}
					const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
					wrapper.axios_post(config, data, url)
					.then((response) => {
						if (response.result && response.result.uids && response.result.uids.length) {
							const uid = response.result.uids[0];
							const record = response.result[uid];
							scrape_genbank(record)
							.then((genbank) => {
								scrape_result.genbank += genbank.length;
								scrape_refseq(record)
								.then((refseq) => {
									scrape_result.refseq += refseq.length;
									record.assemblyid = record.assemblyid.toString();
									record.genbank = JSON.stringify(genbank);
									record.refseq = JSON.stringify(refseq);
									record.taxid = record.taxid.toString();
									let sql = 'REPLACE INTO ncbi (';
									sql += 'uid, ';
									sql += 'assembly_accession, ';
									sql += 'assembly_id, ';
									sql += 'assembly_name, ';
									sql += 'genbank_urls, ';
									sql += 'refseq_urls, ';
									sql += 'organism, ';
									sql += 'taxid';
									sql += ') VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
									const params = [
										record.uid,
										record.assembly_accession,
										record.assemblyid,
										record.assembly_name,
										record.genbank,
										record.refseq,
										record.organism_name,
										record.taxid
									];
									wrapper.sqlite3_run(sql, params)
									.then(() => {									
										setTimeout(() => {
											element.update_progress_bar(1);
											if (document.getElementById('progress_bar_area').style.display === 'block') {
												scrape_next(id_list, index + 1, scrape_result).then((scrape_result) => { return resolve(scrape_result); });
											}
											else { return resolve(scrape_result); }
										}, 1000);
									});
								});
							});
						}
						else {
							scrape_result.failed++;
							setTimeout(() => {
								element.update_progress_bar(1);
								if (document.getElementById('progress_bar_area').style.display === 'block') {
									scrape_next(id_list, index + 1, scrape_result).then(() => { return resolve(scrape_result); });
								}
								else { return resolve(scrape_result); }
							}, 1000);
						}
					});
				}
				else {
					scrape_start = 0;
					scrape_result.completed = true;
					element.hide_progress_bar(); return resolve(scrape_result);
				}
			});
		}
		/////////////////////////////////////////////////////
		// METHOD FUNCTION //////////////////////////////////
		function scrape_genbank(record) {
			return new Promise((resolve) => {
				const genbank = [];
				let base_url = 'https://ftp.ncbi.nlm.nih.gov/genomes/all/';
				if (record.assembly_accession && record.assembly_name) {
					const parts = record.assembly_accession.split('_');
					const folder_0 = parts[0];
					const folder_1 = parts[1].substring(0, 3);
					const folder_2 = parts[1].substring(3, 6);
					const folder_3 = parts[1].substring(6, 9);
					base_url += folder_0 + '/' + folder_1 + '/' + folder_2 + '/' + folder_3 + '/';
					scrape_directory(base_url)
					.then((directory) => {
						if (directory.length) {
							for (let i = 0; i < directory.length; i++) {
								let assets = new ASSETS();
								assets.root = base_url + directory[i];
								genbank.push(assets);
							}
							scrape_assets(genbank).then((result) => { return resolve(result); });
						}
						else { return resolve([]); }
					});
				}
				else { return resolve([]); }
			});
		}
		///////////////////////////////////////////////////////
		// METHOD FUNCTION //////////////////////////////////
		function scrape_refseq(record) {
			return new Promise((resolve) => {
				const refseq = [];
				function ASSETS() {
					this.cds = '';
					this.feature_count = '';
					this.feature_table = '';
					this.genome = '';
					this.proteome = '';
					this.report = '';
					this.rna = '';
					this.root = '';
					this.stats = '';
					this.translated_cds = '';
				}
				const base_url = 'https://ftp.ncbi.nlm.nih.gov/genomes/all/annotation_releases/' + record.taxid + '/';
				scrape_directory(base_url)
				.then((directory) => {
					if (directory.length) {
						let assets = new ASSETS();
						assets.root = base_url + directory[0];
						scrape_directory(assets.root)
						.then((sub_directory) => {
							if (sub_directory.length) {
								for (let i = 0; i < sub_directory.length; i++) {
									if (sub_directory[i].startsWith('GCF_')) {
										assets.root += sub_directory[i];
										break;
									}
								}
								refseq.push(assets);
								scrape_assets(refseq).then((result) => { return resolve(result); });
							}
							else { return resolve(refseq); }
						});
					}
					else { return resolve(refseq); }
				});
			});
		}
	}
}
///////////////////////////////////////////////////////////////////////////////