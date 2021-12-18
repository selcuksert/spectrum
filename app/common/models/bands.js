// Class based enum pattern: https://2ality.com/2020/01/enum-pattern.htmlölkk
class Bands {
    constructor(name, min, max) {
        this.name = name;
        this.min = min;
        this.max = max;
    }

    static FM = new Bands('FM', 87.5, 108);

    static VHF = new Bands('VHF', 174, 216);

    static UHF = new Bands('UHF', 470, 806);

}

module.exports = Bands;