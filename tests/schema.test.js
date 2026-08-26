import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, USER_SHEETS, inputHeaderKey } from '../src/infrastructure/schema.js';

describe('Google Sheets console schema', () => {
  it('uses ordered, human-readable workspace tabs', () => {
    expect(SCHEMA_VERSION).toBe(4);
    expect(Object.values(USER_SHEETS)).toEqual([
      '00_BẮT_ĐẦU',
      '01_TỔNG_QUAN',
      '02_CÔNG_NỢ',
      '03_NHẬP_ĐỐI_TƯỢNG',
      '04_NHẬP_CHỨNG_TỪ',
      '05_KẾT_QUẢ_NHẬP',
      '06_DANH_MỤC'
    ]);
  });

  it('maps friendly input labels back to stable import keys', () => {
    expect(inputHeaderKey('Tên đối tượng *')).toBe('Ten_DT');
    expect(inputHeaderKey('Sẵn sàng nhập')).toBe('San_Sang_Nhap');
    expect(inputHeaderKey('Loại công nợ *')).toBe('Loai_Cong_No');
    expect(inputHeaderKey('So_Chung_Tu')).toBe('So_Chung_Tu');
  });
});
