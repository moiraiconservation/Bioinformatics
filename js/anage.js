///////////////////////////////////////////////////////////////////////////////
// anage.js ///////////////////////////////////////////////////////////////////
//===========================================================================//
// Notes:                                                                    //
// 	Requires elements.js, tab.js, and wrappers.js                            //
//===========================================================================//
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function ANAGE() {
	////////////////////////////////////////////////////////////////////////
	// MEMBER VARIABLES ////////////////////////////////////////////////////
	const element = new ELEMENT();
	const wrapper = new WRAPPER();
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.to_database = (str) => {
		return new Promise((resolve) => {
			const obj = parse_tab_delimited(str);
			let sql = "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'anage'";
			element.show_spinner();
			wrapper.sqlite3_all(sql)
				.then((rows) => {
					if (!rows.length) {
						sql = 'CREATE table anage (';
						sql += 'HAGRID TEXT NOT NULL PRIMARY KEY, ';
						sql += 'tax_kingdom TEXT NOT NULL, ';
						sql += 'tax_phylum TEXT NOT NULL, ';
						sql += 'tax_class TEXT NOT NULL, ';
						sql += 'tax_order TEXT NOT NULL, ';
						sql += 'tax_family TEXT NOT NULL, ';
						sql += 'tax_genus TEXT NOT NULL, ';
						sql += 'tax_species TEXT NOT NULL, ';
						sql += 'common_name TEXT NOT NULL, ';
						sql += 'female_maturity_days INTEGER NOT NULL, ';
						sql += 'male_maturity_days INTEGER NOT NULL, ';
						sql += 'gestation_days INTEGER NOT NULL, ';
						sql += 'weaning_days INTEGER NOT NULL, ';
						sql += 'litter_size INTEGER NOT NULL, ';
						sql += 'litters_per_year INTEGER NOT NULL, ';
						sql += 'interbirth_interval_days INTEGER NOT NULL, ';
						sql += 'birth_weight_grams INTEGER NOT NULL, ';
						sql += 'weaning_weight_grams INTEGER NOT NULL, ';
						sql += 'adult_weight_grams INTEGER NOT NULL, ';
						sql += 'growth_rate_grams_per_day REAL NOT NULL, ';
						sql += 'maximum_longevity_years REAL NOT NULL, ';
						sql += 'source TEXT NOT NULL, ';
						sql += 'specimen_origin TEXT NOT NULL, ';
						sql += 'sample_size TEXT NOT NULL, ';
						sql += 'data_quality TEXT NOT NULL, ';
						sql += 'imr_per_year REAL NOT NULL, ';
						sql += 'mrdt_per_year REAL NOT NULL, ';
						sql += 'metabolic_rate_watts REAL NOT NULL, ';
						sql += 'body_mass_grams REAL NOT NULL, ';
						sql += 'temperature_kelvin REAL NOT NULL, ';
						sql += 'BIBLIO_ID TEXT NOT NULL';
						sql += ')';
						wrapper.sqlite3_run(sql)
						.then((success) => {
							if (success) {
								element.hide_spinner();
								element.show_progress_bar('Uploading to Database', 1, obj.data.length);
								to_database_next(obj.data, 1)
								.then(() => { return resolve(); })
							}
							else {
								element.hide_spinner();
								return resolve();
							}
						});
					}
					else {
						element.hide_spinner();
						element.show_progress_bar('Uploading to Database', 1, obj.data.length);
						to_database_next(obj.data, 1)
						.then(() => { return resolve(); })
					}
				});
		});

		//////////////////////////////////////////////////////////////////////
		// METHOD FUNCTION ///////////////////////////////////////////////////
		function to_database_next(data, index) {
			return new Promise((resolve) => {
				if ((index < data.length) && (data[index].length == 31)) {
					let sql = 'REPLACE INTO anage (';
					sql += 'HAGRID, ';
					sql += 'tax_kingdom, ';
					sql += 'tax_phylum, ';
					sql += 'tax_class, ';
					sql += 'tax_order, ';
					sql += 'tax_family, ';
					sql += 'tax_genus, ';
					sql += 'tax_species, ';
					sql += 'common_name, ';
					sql += 'female_maturity_days, ';
					sql += 'male_maturity_days, ';
					sql += 'gestation_days, ';
					sql += 'weaning_days, ';
					sql += 'litter_size, ';
					sql += 'litters_per_year, ';
					sql += 'interbirth_interval_days, ';
					sql += 'birth_weight_grams, ';
					sql += 'weaning_weight_grams, ';
					sql += 'adult_weight_grams, ';
					sql += 'growth_rate_grams_per_day, ';
					sql += 'maximum_longevity_years, ';
					sql += 'source, ';
					sql += 'specimen_origin, ';
					sql += 'sample_size, ';
					sql += 'data_quality, ';
					sql += 'imr_per_year, ';
					sql += 'mrdt_per_year, ';
					sql += 'metabolic_rate_watts, ';
					sql += 'body_mass_grams, ';
					sql += 'temperature_kelvin, ';
					sql += 'BIBLIO_ID';
					sql += ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
					wrapper.sqlite3_run(sql, data[index])
					.then(() => {
						element.update_progress_bar(1);
						if (document.getElementById('progress_bar_area').style.display === 'block') {
							to_database_next(data, index + 1).then(() => { return resolve(); });
						}
						else { return resolve(); }
					});
				}
				else {
					element.hide_progress_bar();
					return resolve();
				}
			});
		}
		//////////////////////////////////////////////////////////////////////
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.bibliography_to_database = (str) => {
		return new Promise((resolve) => {
			const obj = parse_tab_delimited(str);
			let sql = "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'anage_bibliography'";
			element.show_spinner();
			wrapper.sqlite3_all(sql)
				.then((rows) => {
					if (!rows.length) {
						sql = 'CREATE table anage_bibliography (';
						sql += 'BIBLIO_ID TEXT NOT NULL PRIMARY KEY, ';
						sql += 'authors_and_year TEXT NOT NULL, ';
						sql += 'title TEXT NOT NULL, ';
						sql += 'citations INTEGER NOT NULL, ';
						sql += 'external_link TEXT NOT NULL';
						sql += ')';
						wrapper.sqlite3_run(sql)
							.then((success) => {
								if (success) {
									element.hide_spinner();
									element.show_progress_bar('Uploading to Database', 1, obj.data.length);
									bibliography_to_database_next(obj.data, 1)
										.then(() => { return resolve(); })
								}
								else {
									element.hide_spinner();
									return resolve();
								}
							});
					}
					else {
						element.hide_spinner();
						element.show_progress_bar('Uploading to Database', 1, obj.data.length);
						bibliography_to_database_next(obj.data, 1)
							.then(() => { return resolve(); })
					}
				});
		});

		//////////////////////////////////////////////////////////////////////
		// METHOD FUNCTION ///////////////////////////////////////////////////
		function bibliography_to_database_next(data, index) {
			return new Promise((resolve) => {
				if ((index < data.length) && (data[index].length == 5)) {
					let sql = 'REPLACE INTO anage_bibliography (';
					sql += 'BIBLIO_ID, ';
					sql += 'authors_and_year, ';
					sql += 'title, ';
					sql += 'citations, ';
					sql += 'external_link';
					sql += ') VALUES (?, ?, ?, ?, ?)';
					wrapper.sqlite3_run(sql, data[index])
						.then(() => {
							element.update_progress_bar(1);
							if (document.getElementById('progress_bar_area').style.display === 'block') {
								bibliography_to_database_next(data, index + 1).then(() => { return resolve(); });
							}
							else { return resolve(); }
						});
				}
				else {
					element.hide_progress_bar();
					return resolve();
				}
			});
		}
		//////////////////////////////////////////////////////////////////////
	}
	////////////////////////////////////////////////////////////////////////
}
///////////////////////////////////////////////////////////////////////////////