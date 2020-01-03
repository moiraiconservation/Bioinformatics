///////////////////////////////////////////////////////////////////////////////////////////////////
// STATISTICS /////////////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////////////////////////
// STATS OBJECT ///////////////////////////////////////////////////////////////////////////////////

function STATS() {

    //////////////////////////////////////////////////////////////////////
    // INITIALIZE VARIABLES //////////////////////////////////////////////

    this.data       =   undefined;
    this.value      =   { };
    this.tooltip    =   { };

    // tooltips
    this.tooltip.min = 'The minimum is the smallest value within the set of numbers';
    this.tooltip.max = 'The maximum is the largest value within the set of numbers';
    this.tooltip.mean = 'The mean is the average value of the set of numbers';
    this.tooltip.median = 'The median is the number that falls exactly within the middle of the set of numbers, when the set is sorted from smallest to largest value';
    this.tooltip.mode = 'The mode is the number that appears most often within the set of numbers.  When graphically viewing a set of numbers as a distribution, the mode will correspond to the highest peak.  If more than one number appears equally as often, the mode will be given as a list of numbers.';
    this.tooltip.quartile = 'If a set of numbers is sorted from the smallest value to the largest value, then the number that occurs midway through the set is the second quartile (also called the median).  The number that occurs midway between the smallest value and the median is the first quartile, and the number that occurs midway between the median and the largest value is the third quartile.  When viewing a set of numbers graphically as a distribution, a large portion of the numbers will '; this.tooltip.quartile += 'tend to fall between the first and third quartiles.';
    this.tooltip.iqr = 'The interquartile range is the difference between the first quartile and the third quartile.';
    this.tooltip.variance = 'Variance is a measure how far a set of numbers are spread out from their average value.';
    this.tooltip.stdev = 'The standard deviation is the average distance to the mean of a set of numbers.  In other words, if the difference is calculated between each number in the set and the average value, the standard deviation will be the average of the differences.  If the distribution of the set of numbers forms a normal (or Gaussian, or bell curve) distribution, then 68.2% of the numbers will be within plus or minus one standard deviation of the mean.';
    this.tooltip.sem = 'The standard error of the means (SEM) indicates how likely the average of a set of sample means represents the mean of the population.  It is assumed that there is a 68.2% probability that the population mean falls within plus or minus one SEM of the average of the sample means.';
    this.tooltip.skew = 'Skewness is a measure of the asymmetry of the distribution of a set of numbers.  The skewness of a normal (or Gaussian, or bell curve) distribution is zero.  Negative values indicate a distribution that is skewed to the left, and positive values indicate a distribution that is skewed to the right.';
    this.tooltip.kurtosis = 'Kurtosis is a measure of how much of a distribution is within the tails (portions to the left and/or right of a peak).  The kurtosis of a normal (or Gaussian, or bell curve) distribution is 3.  Values less than 3 indicate a flat distribution (plateau-shaped) and are called platykurtic.  Values greater than 3 are called leptokurtic, and have one or more long tails.';
    this.tooltip.mad = 'The median absolute deviation is the median distance to the median of a set of numbers.  In other words, if the difference is calculated between each number in the set and the median value, the median absolute deviation will be the median of the absolute differences.  Median absolute deviation is often given as a more robust substitute for standard deviation since it is less susceptible to influence from outliers.';

    //////////////////////////////////////////////////////////////////////
    // METHODS ///////////////////////////////////////////////////////////

    this.load = function(data) {
        data = this.sort(data);
        this.data = data;
        this.value = { };
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.clear = function() {
        this.data   =   undefined;
        this.value  =   { };
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.sort = function(d) {
        d.sort(function(a, b) {
            if (a < b) { return -1; }
            if (a > b) { return  1; }
            return 0;
        }); // end sort
        return d;
    }; // end if

    //////////////////////////////////////////////////////////////////////
    // DESCRIPTIVE STATISTICS ////////////////////////////////////////////

    this.min = function(d) {
        if (!d) {
            if (this.data) {
                if (this.value.min) { return this.value.min; }
                else { this.value.min = this.data[0]; return this.value.min; }
            } // end if
            else { return undefined; }
        } // end if
        let data = this.sort(d);
        return data[0];
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.max = function(d) {
        if (!d) {
            if (this.data) {
                if (this.value.max) { return this.value.max; }
                else { this.value.max = this.data[this.data.length - 1]; return this.value.max; }
            } // end if
            else { return undefined; }
        } // end if
        let data = this.sort(d);
        return data[data.length - 1];
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.mean = function(d) {
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.mean) { return this.value.mean; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        let mean = 0;
        for (let i = 0; i < data.length; i++) {
            mean += data[i];
        } // end for loop
        mean = mean / data.length;
        if (!d && this.data) { this.value.mean = mean; }
        return mean;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.median = function(d) {
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.median) { return this.value.median; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = this.sort(d); }
        let median = 0;
        if (data.length % 2 == 0) {
            let index = data.length / 2;
            median = (data[index - 1] + data[index]) / 2;
        } // end if
        else {
            let index = Math.ceil(data.length / 2) - 1;
            median = data[index];
        } // end else
        if (!d && this.data) { this.value.median = median; }
        return median;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.mode = function(d) {
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.mode) { return this.value.mode; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        let list = [];
        let primary_mode = 0;
        let maxValue = 0;
        let mode = [];
        data.forEach(function(currentValue, index, arr) {
        	if (typeof(list[currentValue]) == "undefined") { list[currentValue] = 1; }
        	else { list[currentValue] = list[currentValue] + 1 ; }
        }); // end forEach
        list.forEach(function(currentValue, index, arr) {
            if (currentValue > maxValue) { maxValue = currentValue; primary_mode = index; }
        }); // end forEach
        mode.push(primary_mode);
        list.forEach(function(currentValue, index, arr) {
            if ((list[index] == list[primary_mode]) && (index != primary_mode)) { mode.push(index); }
        }); // end forEach
        if (!d && this.data) { this.value.mode = mode; }
        return mode;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.quartiles = function(d) {
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.quartiles) { return this.value.quartiles; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = this.sort(d); }
        let index1 = 0;
        let index3 = 0;
        let quartile = { };
        if (data.length < 4) { return quartile; }
        if (data.length % 2 == 0) {
            index1 = data.length / 2;
            index2 = index1;
        } // end if
        else {
            index1 = Math.ceil(data.length / 2) - 1;
            index2 = index1 + 2;
        } // end else
        quartile.q1 = this.median(data.slice(0, index1));
        quartile.q2 = this.median(d);
        quartile.q3 = this.median(data.slice(index2, data.length));
        quartile.iqr = Math.abs(quartile.q3 - quartile.q1);
        if (!d && this.data) { this.value.quartiles = quartile; }
        return quartile;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.centralMoment = function(d, moment) {
        if (!moment) { moment = 2; }
        let data = undefined;
        if (!this.value.centralMoment) { this.value.centralMoment = []; }
        if (!d) {
            if (this.data) {
                if (this.value.centralMoment[moment]) { return this.value.centralMoment[moment]; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        if (data.length < 2) { return undefined; }
        let mean = this.mean(d);
        let centralMoment = 0;
        for (let i = 0; i < data.length; i++) {
            centralMoment += Math.pow((data[i] - mean), moment);
        } // end for loop
        if (!d && this.data) { this.value.centralMoment[moment] = centralMoment; }
        return centralMoment;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.variance = function(d, sample) {
        if (!sample) { sample = false; }
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.variance) { return this.value.variance; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        if (data.length < 4) { return undefined; }
        let centralMoment = this.centralMoment(d, 2);
        let variance = 0;
        if (sample) { variance = centralMoment / (data.length - 1); }
        else { variance = centralMoment / data.length; }
        if (!d && this.data) { this.value.variance = variance; }
        return variance;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.stdev = function(d, sample) {
        if (!sample) { sample = false; }
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.stdev) { return this.value.stdev; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        if (data.length < 4) { return undefined; }
        let variance = this.variance(d, sample);
        let stdev = Math.sqrt(variance);
        if (!d && this.data) { this.value.stdev = stdev; }
        return stdev;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.sem = function(d) {
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.sem) { return this.value.sem; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        if (data.length < 4) { return undefined; }
        let n = data.length;
        let stdev = this.stdev(d, true);
        let sem = n / Math.sqrt(stdev);
        if (!d && this.data) { this.value.sem = sem; }
        return sem;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.skew = function(d, sample) {
        if (!sample) { sample = false; }
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.skew) { return this.value.skew; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        if (data.length < 4) { return undefined; }
        let stdev = this.stdev(d, sample);
        let n = data.length;
        let mean = this.mean(d);
        let moment = 0;
        let skew = 0;
        for (let i = 0; i < data.length; i++) {
            moment += Math.pow(((data[i] - mean) / stdev), 3);
        } // end for loop
        if (sample) { skew = moment * (n / ((n - 1) * (n - 2))); }
        else { skew = moment / n; }
        let standard_error = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
        let obj = { };
        obj.skew = skew;
        obj.standard_error = standard_error;
        obj.direction = 'symmetric';
        obj.z_score = skew / standard_error;
        obj.significant = false;

        if (skew < 0) { obj.direction = 'left';  }
        if (skew > 0) { obj.direction = 'right'; }

        if ((n <   50) && (obj.z_score > 1.96)) { obj.significant = true; }
        if ((n >=  50) && (n < 300) && (obj.z_score > 3.29)) { obj.significant = true; }
        if ((n >= 300) && (Math.abs(obj.skew) > 2.00)) { obj.significant = true; }

        obj.description = 'The degree of skewness is ';
        if (obj.significant) { obj.description += 'significant to the ' + obj.direction + '.'; }
        else { obj.description += 'not significant.'; }

        return obj;
    }; // end function

    //////////////////////////////////////////////////////////////////////

    this.kurtosis = function(d, sample) {
        if (!sample) { sample = false; }
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.kurtosis) { return this.value.kurtosis; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        if (data.length < 4) { return undefined; }
        let moment = 0;
        let kurtosis = 3;
        let n = data.length;
        let stdev = this.stdev(d, sample);
        let mean = this.mean(d);
        let skew = this.skew(d, sample);
        if (sample) {
            let moment4 = this.centralMoment(d, 4);
            kurtosis = moment4 / Math.pow(stdev, 4);
            kurtosis = kurtosis * ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)));
            kurtosis = kurtosis - ((3 * Math.pow((n - 1), 2)) / ((n - 2) * (n - 3)));
        } // end if
        else {
            let moment2 = this.centralMoment(d, 2);
            let moment4 = this.centralMoment(d, 4);
            kurtosis = moment4 / Math.pow(moment2, 2);
            kurtosis = kurtosis * n;
            kurtosis = kurtosis - 3;
        } // end else
        let excess_kurtosis = kurtosis - 3;
        let standard_error = Math.sqrt((Math.pow(n, 2) - 1) / ((n - 3) * (n + 5)));
        standard_error = standard_error * 2 * skew.standard_error;
        let obj = { };
        obj.kurtosis = kurtosis;
        obj.excess_kurtosis = excess_kurtosis;
        obj.standard_error = standard_error;
        obj.z_score = kurtosis / standard_error;
        obj.significant = false;

        if (kurtosis == 3) { obj.category = 'mesokurtic';  }
        if (kurtosis  > 3) { obj.category = 'leptokurtic'; }
        if (kurtosis  < 3) { obj.category = 'platykurtic'; }

        if ((n <   50) && (obj.z_score > 1.96)) { obj.significant = true; }
        if ((n >=  50) && (n < 300) && (obj.z_score > 3.29)) { obj.significant = true; }
        if ((n >= 300) && (Math.abs(obj.kurtosis) > 7.00)) { obj.significant = true; }

        obj.description = 'The degree of kurtosis is ';
        if (obj.significant) { obj.description += 'significant and the distribution is ' + obj.category + '.'; }
        else { obj.description += 'not significant.'; }

        return obj;
    }; // end function

    //////////////////////////////////////////////////////////////////////
    // ROBUST DESCRIPTIVE STATISTICS /////////////////////////////////////

    this.mad = function(d) {
        let data = undefined;
        if (!d) {
            if (this.data) {
                if (this.value.mad) { return this.value.mad; }
                else { data = this.data; }
            } // end if
            else { return undefined; }
        } // end if
        else { data = d; }
        let n = data.length;
        let median = this.median(d);
        let distribution = [];
        for (let i = 0; i < n; i++) {
            distribution.push(Math.abs(data[i] - median));
        } // end for loop
        let mad = this.median(distribution);
        if (!d && this.data) { this.value.mad = mad; }
        return mad;
    }; // end function

    //////////////////////////////////////////////////////////////////////
    // SUMMARY FUNCTIONS /////////////////////////////////////////////////

    this.description = function(sample) {
        if (!sample) { sample = false; }
        let description = { };
        description.n = this.data.length;
        description.min = this.min();
        description.max = this.max();
        description.mean = this.mean();
        description.mode = this.mode();
        description.quartile = this.quartiles();
        description.median = this.median();
        description.variance = this.variance(undefined, sample);
        if (sample) { description.sem = this.sem(); }
        description.stdev = this.stdev(undefined, sample);
        description.skew = this.skew(undefined, sample);
        description.kurtosis = this.kurtosis(undefined, sample);
        description.mad = this.mad();
        return description;
    }; // end function

}; // end constructor

///////////////////////////////////////////////////////////////////////////////////////////////////
