import { BN } from '@project-serum/anchor';
import { Decimal } from './decimal';
import { assert } from 'chai';

describe('decimal', () => {
  it('positive integers', async function () {
    // 1
    const one = new Decimal(0, 0, 1, 0);
    assert.isTrue(one.toBN().eq(new BN(1)));
    assert.equal(one.toNumber(), 1);
    assert.equal(one.scale, 0);
    assert.isFalse(one.isNegative());
    assert.isTrue(one.isPositive());
    assert.equal(one.toString(), '1');
    const one_conv = Decimal.fromBN(one.toBN(), 0);
    assert.isTrue(one_conv.toBN().eq(new BN(1)));
    assert.equal(one_conv.toNumber(), 1);
    assert.equal(one_conv.scale, 0);
    assert.isFalse(one_conv.isNegative());
    assert.isTrue(one_conv.isPositive());
    assert.equal(one_conv.toString(), '1');

    // 0
    const zero = new Decimal(0, 0, 0, 0);
    assert.isTrue(zero.toBN().eq(new BN(0)));
    assert.equal(zero.toNumber(), 0);
    assert.equal(zero.scale, 0);
    assert.isFalse(zero.isNegative());
    assert.isTrue(zero.isPositive());
    assert.equal(zero.toString(), '0');
    const zero_conv = Decimal.fromBN(zero.toBN(), 0);
    assert.isTrue(zero_conv.toBN().eq(new BN(0)));
    assert.equal(zero_conv.toNumber(), 0);
    assert.equal(zero_conv.scale, 0);
    assert.isFalse(zero_conv.isNegative());
    assert.isTrue(zero_conv.isPositive());
    assert.equal(zero_conv.toString(), '0');

    // 18373948
    const int1 = new Decimal(0, 0, 18373948, 0);
    assert.isTrue(int1.toBN().eq(new BN(18373948)));
    assert.equal(int1.toNumber(), 18373948);
    assert.equal(int1.scale, 0);
    assert.isFalse(int1.isNegative());
    assert.isTrue(int1.isPositive());
    assert.equal(int1.toString(), '18373948');
    const int1_conv = Decimal.fromBN(int1.toBN(), 0);
    assert.isTrue(int1_conv.toBN().eq(new BN(18373948)));
    assert.equal(int1_conv.toNumber(), 18373948);
    assert.equal(int1_conv.scale, 0);
    assert.isFalse(int1_conv.isNegative());
    assert.isTrue(int1_conv.isPositive());
    assert.equal(int1_conv.toString(), '18373948');

    // Max safe `Number`: 9007199254740991
    const max_number = Decimal.fromBN(new BN(9007199254740991), 12);
    assert.isTrue(max_number.toBN().eq(new BN(9007199254740991)));
    assert.equal(max_number.toNumber(), 9007.199254740991);
    assert.equal(max_number.scale, 12);
    assert.isFalse(max_number.isNegative());
    assert.isTrue(max_number.isPositive());
    assert.equal(max_number.toString(), '9007.199254740991');
  });

  it('negative integers', async function () {
    // -1
    const neg_one = new Decimal(2147483648, 0, 1, 0);
    assert.isTrue(neg_one.toBN().eq(new BN(-1)));
    assert.equal(neg_one.toNumber(), -1);
    assert.equal(neg_one.scale, 0);
    assert.isTrue(neg_one.isNegative());
    assert.isFalse(neg_one.isPositive());
    assert.equal(neg_one.toString(), '-1');
    const neg_one_conv = Decimal.fromBN(neg_one.toBN(), 0);
    assert.isTrue(neg_one_conv.toBN().eq(new BN(-1)));
    assert.equal(neg_one_conv.toNumber(), -1);
    assert.equal(neg_one_conv.scale, 0);
    assert.isTrue(neg_one_conv.isNegative());
    assert.isFalse(neg_one_conv.isPositive());
    assert.equal(neg_one_conv.toString(), '-1');

    // -18373948
    const int1 = new Decimal(0, 0, 18373948, 0);
    const neg_int1_bn = int1.toBN().neg();
    const neg_int1 = Decimal.fromBN(neg_int1_bn, 0);
    assert.isTrue(neg_int1.toBN().eq(new BN(-18373948)));
    assert.equal(neg_int1.toNumber(), -18373948);
    assert.equal(neg_int1.scale, 0);
    assert.isTrue(neg_int1.isNegative());
    assert.isFalse(neg_int1.isPositive());
    assert.equal(neg_int1.toString(), '-18373948');
  });

  it('positive fixed point decimals', async function () {
    // const euler = new Decimal(1835008, 1473583531, 2239425882, 3958169141); // 2.7182818284590452353602874714

    // 18373948.64758478
    const dec1 = Decimal.fromBN(new BN(1837394864758478), 8);
    assert.isTrue(dec1.toBN().eq(new BN(1837394864758478)));
    assert.equal(dec1.toNumber(), 18373948.64758478);
    assert.equal(dec1.scale, 8);
    assert.isFalse(dec1.isNegative());
    assert.isTrue(dec1.isPositive());
    assert.equal(dec1.toString(), '18373948.64758478');

    // 999_999_007_199.254740991
    const dec2 = Decimal.fromBN(new BN('999999007199254740991'), 9);
    assert.isTrue(dec2.toBN().eq(new BN('999999007199254740991')));
    assert.equal(dec2.scale, 9);
    assert.isFalse(dec2.isNegative());
    assert.isTrue(dec2.isPositive());
    assert.equal(dec2.toString(), '999999007199.254740991');
  });

  it('negative fixed point decimals', async function () {
    // -18373948.64758478
    const neg_dec1 = Decimal.fromBN(new BN(-1837394864758478), 8);
    assert.isTrue(neg_dec1.toBN().eq(new BN(-1837394864758478)));
    assert.equal(neg_dec1.toNumber(), -18373948.64758478);
    assert.equal(neg_dec1.scale, 8);
    assert.isTrue(neg_dec1.isNegative());
    assert.isFalse(neg_dec1.isPositive());
    assert.equal(neg_dec1.toString(), '-18373948.64758478');
  });
});
