// Class based enum pattern: https://2ality.com/2020/01/enum-pattern.htmlölkk
class Bands {
    constructor(name, min, max) {
        this.name = name;
        this.min = min;
        this.max = max;
    }

    static MF = new Bands('MF', 0.3, 3);

    static HF = new Bands('HF', 3, 30);

    static VHF = new Bands('VHF', 30, 300);

    static UHF = new Bands('UHF', 300, 3000);

}

module.exports = Bands;