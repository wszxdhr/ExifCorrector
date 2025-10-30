import { datetimeFormatToReg } from '../src/utils/datetimeFormatToReg';

describe('datetimeFormatToReg', () => {
  describe('年份格式', () => {
    test('应该将YYYY转换为四位数字正则', () => {
      const regex = datetimeFormatToReg('YYYY');
      expect('2024').toMatch(regex);
      expect('1999').toMatch(regex);
      expect('24').not.toMatch(regex);
    });

    test('应该将YY转换为两位数字正则', () => {
      const regex = datetimeFormatToReg('YY-MM-DD');
      expect('24-01-01').toMatch(regex);
      expect('99-12-31').toMatch(regex);
    });
  });

  describe('月份格式', () => {
    test('应该将MM转换为两位月份正则(01-12)', () => {
      const regex = datetimeFormatToReg('MM');
      expect('01').toMatch(regex);
      expect('12').toMatch(regex);
      expect('00').not.toMatch(regex);
      expect('13').not.toMatch(regex);
      expect('1').not.toMatch(regex);
    });

    test('应该将M转换为一到两位月份正则(1-12)', () => {
      const regex = datetimeFormatToReg('YYYY-M-DD');
      expect('2024-1-01').toMatch(regex);
      expect('2024-9-01').toMatch(regex);
      expect('2024-12-31').toMatch(regex);
    });
  });

  describe('日期格式', () => {
    test('应该将DD转换为两位日期正则(01-31)', () => {
      const regex = datetimeFormatToReg('DD');
      expect('01').toMatch(regex);
      expect('15').toMatch(regex);
      expect('31').toMatch(regex);
      expect('00').not.toMatch(regex);
      expect('32').not.toMatch(regex);
      expect('1').not.toMatch(regex);
    });

    test('应该将D转换为一到两位日期正则(1-31)', () => {
      const regex = datetimeFormatToReg('YYYY-MM-D');
      expect('2024-01-1').toMatch(regex);
      expect('2024-01-15').toMatch(regex);
      expect('2024-01-31').toMatch(regex);
    });
  });

  describe('小时格式(24小时制)', () => {
    test('应该将HH转换为两位24小时制正则(00-23)', () => {
      const regex = datetimeFormatToReg('HH');
      expect('00').toMatch(regex);
      expect('12').toMatch(regex);
      expect('23').toMatch(regex);
      expect('24').not.toMatch(regex);
      expect('1').not.toMatch(regex);
    });

    test('应该将H转换为一到两位24小时制正则(0-23)，在完整格式中验证', () => {
      const regex = datetimeFormatToReg('YYYY-MM-DD H');
      expect('2024-01-01 0').toMatch(regex);
      expect('2024-01-01 9').toMatch(regex);
      expect('2024-01-01 23').toMatch(regex);
    });
  });

  describe('小时格式(12小时制)', () => {
    test('应该将hh转换为两位12小时制正则(01-12)', () => {
      const regex = datetimeFormatToReg('hh');
      expect('01').toMatch(regex);
      expect('12').toMatch(regex);
      expect('00').not.toMatch(regex);
      expect('13').not.toMatch(regex);
      expect('1').not.toMatch(regex);
    });

    test('应该将h转换为一到两位12小时制正则(1-12)，在完整格式中验证', () => {
      const regex = datetimeFormatToReg('YYYY-MM-DD h');
      expect('2024-01-01 1').toMatch(regex);
      expect('2024-01-01 9').toMatch(regex);
      expect('2024-01-01 12').toMatch(regex);
      expect('2024-01-01 0').not.toMatch(regex);
    });
  });

  describe('分钟格式', () => {
    test('应该将mm转换为两位分钟正则(00-59)', () => {
      const regex = datetimeFormatToReg('mm');
      expect('00').toMatch(regex);
      expect('30').toMatch(regex);
      expect('59').toMatch(regex);
      expect('60').not.toMatch(regex);
      expect('1').not.toMatch(regex);
    });

    test('应该将m转换为一到两位分钟正则(0-59)，在完整格式中验证', () => {
      const regex = datetimeFormatToReg('HH:m');
      expect('10:0').toMatch(regex);
      expect('10:9').toMatch(regex);
      expect('10:59').toMatch(regex);
    });
  });

  describe('秒格式', () => {
    test('应该将ss转换为两位秒正则(00-59)', () => {
      const regex = datetimeFormatToReg('ss');
      expect('00').toMatch(regex);
      expect('30').toMatch(regex);
      expect('59').toMatch(regex);
      expect('60').not.toMatch(regex);
      expect('1').not.toMatch(regex);
    });

    test('应该将s转换为一到两位秒正则(0-59)，在完整格式中验证', () => {
      const regex = datetimeFormatToReg('HH:mm:s');
      expect('10:30:0').toMatch(regex);
      expect('10:30:9').toMatch(regex);
      expect('10:30:59').toMatch(regex);
    });
  });


  describe('组合格式测试', () => {
    test('应该正确处理常见日期时间格式 YYYY-MM-DD HH:mm:ss', () => {
      const regex = datetimeFormatToReg('YYYY-MM-DD HH:mm:ss');
      expect('2024-12-25 14:30:45').toMatch(regex);
      expect('2024-01-01 00:00:00').toMatch(regex);
      expect('2024-12-31 23:59:59').toMatch(regex);
      expect('24-12-25 14:30:45').not.toMatch(regex);
      expect('2024-13-25 14:30:45').not.toMatch(regex);
      expect('2024-12-32 14:30:45').not.toMatch(regex);
    });

    test('应该正确处理紧凑格式 YYYYMMDDHHmmss', () => {
      const regex = datetimeFormatToReg('YYYYMMDDHHmmss');
      expect('20241225143045').toMatch(regex);
      expect('20240101000000').toMatch(regex);
      expect('20241231235959').toMatch(regex);
      expect('2024122514304').not.toMatch(regex);
    });

    test('应该正确处理带斜杠的格式 YYYY/MM/DD', () => {
      const regex = datetimeFormatToReg('YYYY/MM/DD');
      expect('2024/12/25').toMatch(regex);
      expect('2024/01/01').toMatch(regex);
      expect('2024-12-25').not.toMatch(regex);
    });

    test('应该正确处理灵活月日格式 YYYY-M-D', () => {
      const regex = datetimeFormatToReg('YYYY-M-D');
      expect('2024-1-1').toMatch(regex);
      expect('2024-12-31').toMatch(regex);
      expect('2024-9-5').toMatch(regex);
      expect('2024-01-01').not.toMatch(regex);
    });

    test('应该正确处理12小时制格式 YYYY-MM-DD hh:mm:ss', () => {
      const regex = datetimeFormatToReg('YYYY-MM-DD hh:mm:ss');
      expect('2024-12-25 01:30:45').toMatch(regex);
      expect('2024-12-25 12:30:45').toMatch(regex);
      expect('2024-12-25 00:30:45').not.toMatch(regex);
      expect('2024-12-25 13:30:45').not.toMatch(regex);
    });
  });

  describe('特殊字符转义', () => {
    test('应该正确转义正则特殊字符', () => {
      const regex = datetimeFormatToReg('YYYY.MM.DD');
      expect('2024.12.25').toMatch(regex);
      expect('2024X12X25').not.toMatch(regex);
    });

    test('应该正确处理括号', () => {
      const regex = datetimeFormatToReg('(YYYY-MM-DD)');
      expect('(2024-12-25)').toMatch(regex);
      expect('2024-12-25').not.toMatch(regex);
    });

    test('应该正确处理多种特殊字符', () => {
      const regex = datetimeFormatToReg('YYYY[MM]DD');
      expect('2024[12]25').toMatch(regex);
      expect('20241225').not.toMatch(regex);
    });
  });

  describe('边界情况', () => {
    test('应该处理空格', () => {
      const regex = datetimeFormatToReg('YYYY MM DD');
      expect('2024 12 25').toMatch(regex);
      expect('20241225').not.toMatch(regex);
    });

    test('应该避免MM被M提前替换', () => {
      const regex = datetimeFormatToReg('YYYY-MM-DD');
      expect('2024-01-15').toMatch(regex);
      expect('2024-1-15').not.toMatch(regex);
    });

    test('应该避免DD被D提前替换', () => {
      const regex = datetimeFormatToReg('YYYY-MM-DD');
      expect('2024-12-05').toMatch(regex);
      expect('2024-12-5').not.toMatch(regex);
    });
  });
});