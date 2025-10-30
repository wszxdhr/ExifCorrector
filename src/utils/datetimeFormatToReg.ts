export function datetimeFormatToReg(datetimeFormat: string) {
    const map: Record<string, string> = {
        'YYYY': '\\d{4}',
        'YY': '\\d{2}',
        'MM': '(0[1-9]|1[0-2])',
        'M': '([1-9]|1[0-2])',
        'DD': '(0[1-9]|[12][0-9]|3[01])',
        'D': '([1-9]|[12][0-9]|3[01])',
        'HH': '([01][0-9]|2[0-3])',
        'H': '([0-9]|1[0-9]|2[0-3])',
        'hh': '(0[1-9]|1[0-2])',
        'h': '([1-9]|1[0-2])',
        'mm': '([0-5][0-9])',
        'm': '([0-9]|[1-5][0-9])',
        'ss': '([0-5][0-9])',
        's': '([0-9]|[1-5][0-9])',
    };

    // 先转义正则特殊字符
    let regexStr = datetimeFormat.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');

    // 按长占位符优先替换，避免 "M" 把 "MM" 先替换掉
    const tokens = Object.keys(map).sort((a, b) => b.length - a.length);

    for (const key of tokens) {
        regexStr = regexStr.replace(new RegExp(key, 'g'), map[key]);
    }

    return new RegExp(regexStr);
}
