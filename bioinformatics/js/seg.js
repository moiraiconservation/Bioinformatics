///////////////////////////////////////////////////////////////////////////////////////////////////
function seg(sequence, options) {
    //////////////////////////////////////////////////////////////////////
    //   The segmentation (SEG) algorithm finds and soft-masks (sets    //
    //   to lowercase) low-complexity regions of sequences.             //
    //==================================================================//
    //   References:                                                    //
    //   [1] Wootton, J. C., & Federhen, S. (1993). Statistics of       //
    //        local complexity in amino acid sequences and sequence     //
    //        databases. Computers & chemistry, 17(2), 149-163.         //
    //   [2] Wootton, J. C., & Federhen, S. (1996). [33] Analysis of    //
    //        compositionally biased regions in sequence databases.     //
    //        In Methods in enzymology (Vol. 266, pp. 554-571).         //
    //        Academic Press.                                           //
    //////////////////////////////////////////////////////////////////////
    if (typeof(sequence) === 'undefined') { return { }; }
    if (typeof(options ) === 'undefined') { options = { }; }
    if (!options.w           ) { options.w            =  12; }   // trigger window length
    if (!options.k2_1        ) { options.k2_1         = 2.2; }   // trigger complexity (in bits)
    if (!options.k2_2        ) { options.k2_2         = 2.5; }   // extension complexity (in bits)
    if (!options.alphabet    ) { options.alphabet     =  20; }   // the number of possible characters (default set for amino acids)
    if (!options.memory_limit) { options.memory_limit = 500; }   // sequences longer than this will skip calculating P0
    //////////////////////////////////////////////////////////////////////
    // SEED WORDS ////////////////////////////////////////////////////////
    let index = options.w;
    let vector_array = [];
    while (index <= sequence.length) {
        let word = sequence.substring(index - options.w, index);
        let obj = create_vector_object(word, (index - options.w), index, options);
        //////////////////////////////////////////////////////////////////
        // EXTEND ////////////////////////////////////////////////////////
        if (obj.k2 <= options.k2_1) {
            let k2_2 = obj.k2;
            let extend_left  = obj.start - 1;
            let extend_right = obj.end   + 1;
            //////////////////////////////////////////////////////////////
            // EXTEND LEFT ///////////////////////////////////////////////
            while ((k2_2 <= options.k2_2) && (extend_left >= 0)) {
                word = sequence.substring(extend_left, obj.end);
                let new_obj = create_vector_object(word, extend_left, obj.end, options);
                k2_2 = new_obj.k2;
                if (k2_2 <= options.k2_2) { obj = new_obj; }
                extend_left--;
            } // end while
            //////////////////////////////////////////////////////////////
            // EXTEND RIGHT //////////////////////////////////////////////
            k2_2 = obj.k2;
            while ((k2_2 <= options.k2_2) && (extend_right <= sequence.length)) {
                word = sequence.substring(obj.start, extend_right);
                let new_obj = create_vector_object(word, obj.start, extend_right, options);
                k2_2 = new_obj.k2;
                if (k2_2 <= options.k2_2) { obj = new_obj; }
                extend_right++;
            } // end while
            //////////////////////////////////////////////////////////////
            index = obj.end;
            vector_array.push(obj);
        } // end if
        index++;
    } // end while loop
    //////////////////////////////////////////////////////////////////////
    // MERGE OVERLAPPING VECTORS /////////////////////////////////////////
    vector_array = merge_vector_overlap(vector_array);
    let seg_characters = 0;
    for (let i = 0; i < vector_array.length; i++) { seg_characters += vector_array[i].window_length; }
    //////////////////////////////////////////////////////////////////////
    // CALCULATE P0 AND MASK LOW COMPLEXITY SEGMENTS /////////////////////
    if (seg_characters < options.memory_limit) {
        for (let i = 0; i < vector_array.length; i++) {
            let substr_vector_array = [];
            substr_array = get_substrings(sequence.substring(vector_array[i].start, vector_array[i].end), vector_array[i].start);
            for (let j = 0; j < substr_array.length; j++) {
                let N = vector_array[i].alphabet;
                let L = substr_array[j].end - substr_array[j].start;
                let F = 1;
                let omega = 1;
                let substr_vector = create_vector_object(substr_array[j].str, substr_array[j].start, substr_array[j].end, options);
                let r_dist = new Array((N + 1)); r_dist[N] = 0;
                for (let k = 0; k < N; k++) {
                    if (!r_dist[k]) { r_dist[k] = 0; }
                    if (!r_dist[substr_vector.vector[k]]) { r_dist[substr_vector.vector[k]] = 0; }
                    r_dist[substr_vector.vector[k]]++;
                } // end for loop
                for (let k = 0; k < r_dist.length; k++) { if (r_dist[k]) { F = F * factorial(r_dist[k]); } }
                F = factorial(N) / F;
                for (let k = 0; k < substr_vector.vector.length; k++) { if (substr_vector.vector[k]) { omega = omega * factorial(substr_vector.vector[k]); } }
                omega = factorial(L) / omega;
                let P0 = (omega * F) / Math.pow(N, L);
                substr_vector.P0 = P0;
                substr_vector_array.push(substr_vector);
            } // end for loop
            let lowest_P0 = 10000;
            let lowest_P0_index = 0;
            for (j = 0; j < substr_vector_array.length; j++) {
                if (substr_vector_array[j].P0 < lowest_P0) { lowest_P0 = substr_vector_array[j].P0; lowest_P0_index = j; }
            } // end for loop
            let seg_start = substr_vector_array[lowest_P0_index].start;
            let seg_end = substr_vector_array[lowest_P0_index].end;
            let mask = sequence.substring(seg_start, seg_end).toLowerCase();
            sequence = sequence.substr(0, seg_start) + mask + sequence.substr(seg_end);
        } // end for loop
    } // end if
    else {
        //////////////////////////////////////////////////////////////////////
        // ALTERNATIVE QUICK-AND-DIRTY METHOD ////////////////////////////////
        for (let i = 0; i < vector_array.length; i++) {
            let seg_start = vector_array[i].start;
            let seg_end = vector_array[i].end;
            let mask = sequence.substring(seg_start, seg_end).toLowerCase();
            sequence = sequence.substr(0, seg_start) + mask + sequence.substr(seg_end);
        } // end for loop
    } // end else
    //////////////////////////////////////////////////////////////////////
    return sequence;
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    function create_vector_object(word, start, stop, options) {
        let distribution = {};
        for (let i = 0; i < word.length; i++) {
            if (!distribution[word[i]]) { distribution[word[i]] = 0; }
            distribution[word[i]]++;
        } // end for loop
        //////////////////////////////////////////////////////////////////
        // CREATE SEGMENT COMPLEXITY VECTOR //////////////////////////////
        let keys = Object.keys(distribution);
        let alphabet = options.alphabet;
        let vector = [];
        if (keys.length > alphabet) { alphabet = keys.length; }
        for (let i = 0; i < alphabet; i++) {
            if (keys[i]) { vector.push(distribution[keys[i]]); }
            else { vector.push(0); }
        } // end for loop
        // sort the vector, high to low
        vector.sort(function(a, b) {
            if (a < b) { return  1; }
            if (a > b) { return -1; }
            return 0;
        }); // end sort
        //////////////////////////////////////////////////////////////////
        // CALCULATE COMPLEXITY IN BITS //////////////////////////////////
        let complexity = 0;
        for (let i = 0; i < vector.length; i++) {
            if (vector[i]) {
                let a = vector[i] / options.w;
                complexity += (a * Math.log2(a));
            } // end if
        } // end for loop
        complexity = complexity * -1;
        let obj = { alphabet: alphabet, window_length: (stop - start), vector: vector, start: start, end: stop, k2: complexity, keep: true };
        return obj;
    } // end function
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    function merge_vector_overlap(vector_array) {
        let new_vector_array = [];
        for (let i = (vector_array.length - 1); i >= 1; i--) {
            if (vector_array[i].start < vector_array[(i - 1)].end) {
                vector_array[i].keep = false;
                if (vector_array[i].start < vector_array[(i - 1)].start) { vector_array[(i - 1)].start = vector_array[i].start; }
                if (vector_array[i].end   > vector_array[(i - 1)].end  ) { vector_array[(i - 1)].end   = vector_array[i].end;   }
                if (vector_array[i].alphabet > vector_array[(i - 1)].alphabet) { vector_array[(i - 1)].alphabet = vector_array[i].alphabet; }
                vector_array[(i - 1)].window_length = (vector_array[(i - 1)].end - vector_array[(i - 1)].start);
            } // end if
        } // end for loop
        for (let i = 0; i < vector_array.length; i++) {
            if (vector_array[i].keep) { new_vector_array.push(vector_array[i]); }
        } // end for loop
        return new_vector_array;
    } // end function
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    function get_substrings(str, offset) {
        if (typeof(offset) === 'undefined') { offset = 0; }
        var i, j, result = [];
        for (i = 0; i < str.length; i++) {
            for (j = i + 1; j < str.length + 1; j++) {
                let obj = { };
                obj.str = str.slice(i, j);
                obj.start = i + offset;
                obj.end = j + offset;
                result.push(obj);
            } // end for loop
        } // end for loop
        return result;
    } // end function
    //////////////////////////////////////////////////////////////////////
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
function factorial(n) {
    let fact = 1;
    for (var i = 1; i <= n; i++) { fact = fact * i; }
    return fact;
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
