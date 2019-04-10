var bitpack;
(function (bitpack)
{
	function write(target, value, offset, bitsize)
	{
		if (value >= Math.pow(2, bitsize)) throw("value " + value + " is to big for bitsize = " + bitsize);

		var f;
		if (bitsize == 1) 	f = w1;
		else if (bitsize <= 9)	f = w2;
		else if (bitsize <= 17)	f = w3;
		else if (bitsize <= 25)	f = w4;
		f(target, value, offset, bitsize);
	}

	function read(target, offset, bitsize)
	{
		var f;
		if (bitsize == 1) 	f = r1;
		else if (bitsize <= 9)	f = r2;
		else if (bitsize <= 17)	f = r3;
		else if (bitsize <= 25)	f = r4;
		return f(target, offset, bitsize);
	}

	bitpack.write = write;
	bitpack.read = read;

	// bitofset = 0: v0 = v << 7;	m0 = 127 // x0 00 00 00   |   0x xx xx xx
	// bitofset = 1: v0 = v << 6;	m0 = 191 // 0x 00 00 00   |   x0 xx xx xx
	// bitofset = 2: v0 = v << 5;	m0 = 223 // 00 x0 00 00   |   xx 0x xx xx
	// bitofset = 3: v0 = v << 4;	m0 = 239 // 00 0x 00 00   |   xx x0 xx xx
	// bitofset = 4: v0 = v << 3;	m0 = 247 // 00 00 x0 00   |   xx xx 0x xx
	// bitofset = 5: v0 = v << 2;	m0 = 251 // 00 00 0x 00   |   xx xx x0 xx
	// bitofset = 6: v0 = v << 1;	m0 = 253 // 00 00 00 x0   |   xx xx xx 0x
	// bitofset = 7: v0 = v << 0;	m0 = 254 // 00 00 00 0x   |   xx xx xx x0

	// b -> byte offset
	// i -> bit offset
	function w1(target, v, o)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var v0 = v << (7 - i);
		var m0 = 255 - (1 << (7 - i));
		target[b] = target[b] & m0;
		target[b] = target[b] | v0;
	}

	function r1(target, o)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var m = 1 << (7 - i);
		var s = 7 - i;
		return (target[b] & m) >> s;
	}

	// bitsize = 2
	// bitoffset = 0: v0 = v << 6;	m0 = 63					// xy 00 00 00
	// bitoffset = 1: v0 = v << 5;	m0 = 159				// 0x y0 00 00
	// bitoffset = 2: v0 = v << 4;	m0 = 207				// 00 xy 00 00
	// bitoffset = 3: v0 = v << 3;	m0 = 231				// 00 0x y0 00
	// bitoffset = 4: v0 = v << 2;	m0 = 243				// 00 00 xy 00
	// bitoffset = 5: v0 = v << 1;	m0 = 249				// 00 00 0x y0
	// bitoffset = 6: v0 = v << 0;	m0 = 252				// 00 00 00 xy
	// bitoffset = 7: v0 = v >> 1;	m0 = 254 v1 = (v % 2) << 7; m1 = 127	// 00 00 00 0x | y0 00 00 00

	// bitsize = 3
	// bitoffset = 0: v0 = v << 5; m0 = 31					// xy z0 00 00
	// bitoffset = 1: v0 = v << 4; m0 = 143					// 0x yz 00 00
	// bitoffset = 2: v0 = v << 3; m0 = 199					// 00 xy z0 00
	// bitoffset = 3: v0 = v << 2; m0 = 227					// 00 0x yz 00
	// bitoffset = 4: v0 = v << 1; m0 = 241					// 00 00 xy z0
	// bitoffset = 5: v0 = v << 0; m0 = 248					// 00 00 0x yz
	// bitoffset = 6: v0 = v >> 1; m0 = 252 v1 = (v % 2) << 7; m1 = 127	// 00 00 00 xy | z0 00 00 00
	// bitoffset = 7: v0 = v >> 2; m0 = 254 v1 = (v % 4) << 6; m1 = 63	// 00 00 00 0x | yz 00 00 00

	// bitsize = 4
	// bitoffset = 0: v0 = v << 4;	m0 = 15					// xy zt 00 00
	// bitoffset = 1: v0 = v << 3;	m0 = 135				// 0x yz t0 00
	// bitoffset = 2: v0 = v << 2;	m0 = 195				// 00 xy zt 00
	// bitoffset = 3: v0 = v << 1;	m0 = 225				// 00 0x yz t0
	// bitoffset = 4: v0 = v << 0;	m0 = 240				// 00 00 xy zt
	// bitoffset = 5: v0 = v >> 1;	m0 = 248 v1 = (v % 2) << 7; m1 = 127	// 00 00 0x yz | t0 00 00 00
	// bitoffset = 6: v0 = v >> 2;	m0 = 252 v1 = (v % 4) << 6; m1 = 63	// 00 00 00 xy | zt 00 00 00
	// bitoffset = 7: v0 = v >> 3;	m0 = 254 v1 = (v % 8) << 5; m1 = 31	// 00 00 00 0x | yz t0 00 00

	// ...
	// ..
	// this goes up to bitsize = 9

	// bitsize = 9
	// bitoffset = 0: v0 = v >> 1;	m0 = 0	 v1 = (v % 2) << 7; m1 = 127 	// ab cd ef gh | i0 00 00 00
	// bitoffset = 1: v0 = v >> 2;	m0 = 128 v1 = (v % 4) << 6; m1 = 63 	// 0a bc de fg | hi 00 00 00
	// bitoffset = 2: v0 = v >> 3;	m0 = 192 v1 = (v % 8) << 5; m1 = 31 	// 00 ab cd ef | gh i0 00 00
	// bitoffset = 3: v0 = v >> 4;	m0 = 224 v1 = (v % 16) << 4; m1 = 15	// 00 0a bc de | fg hi 00 00
	// bitoffset = 4: v0 = v >> 5;	m0 = 240 v1 = (v % 32) << 3; m1 = 7	// 00 00 ab cd | ef gh i0 00
	// bitoffset = 5: v0 = v >> 6;	m0 = 248 v1 = (v % 64) << 2; m1 = 3	// 00 00 0a bc | de fg hi 00
	// bitoffset = 6: v0 = v >> 7;	m0 = 252 v1 = (v % 128) << 1; m1 = 1	// 00 00 00 ab | cd ef gh i0
	// bitoffset = 7: v0 = v >> 8;	m0 = 254 v1 = (v % 256) << 0; m1 = 0	// 00 00 00 0a | bc de fg hi

	function w2(target, v, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var v0 = 0;
		var v1 = 0;

		var m0 = 255;
		var m1 = 255;

		if (bs + i <= 8)
		{
			v0 = v << (8 - bs - i);
			m0 = 255 - ((255 >> (8 - bs)) << (8 - bs - i))
		}
		else
		{
			v0 = v >> (bs + i - 8);
			v1 = (v % Math.pow(2, (bs + i - 8))) << (16 - bs - i);

			// bs, i
			// 2, 0: m0 = 63
			// 2, 1: m0 = 159
			// 2, 2: m0 = 207
			// 2, 3: m0 = 231
			// 2, 4: m0 = 243
			// 2, 5: m0 = 249
			// 2, 6: m0 = 252
			// 2, 7: m0 = 254
			
			// 3, 0: m0 = 31
			// 3, 1: m0 = 143
			// 3, 2: m0 = 199
			// 3, 3: m0 = 227
			// 3, 4: m0 = 241
			// 3, 5: m0 = 248
			// 3, 6: m0 = 252
			// 3, 7: m0 = 254

			// 8, 0: m0 = 0
			// 8, 1: m0 = 128
			// 8, 2: m0 = 192
			// 8, 3: m0 = 224
			// 8, 4: m0 = 240
			// 8, 5: m0 = 248
			// 8, 6: m0 = 252
			// 8, 7: m0 = 254
			
			// 9, 0: m0 = 0		m1 = 127
			// 9, 1: m0 = 128 	m1 = 63
			// 9, 2: m0 = 192 	m1 = 31
			// 9, 3: m0 = 224 	m1 = 15
			// 9, 5: m0 = 248 	m1 = 7
			// 9, 4: m0 = 240 	m1 = 3
			// 9, 6: m0 = 252 	m1 = 1
			// 9, 7: m0 = 254 	m1 = 0
	
			m0 = 255 - (255 >> i);
			m1 = 255 >> (bs + i - 8)
		}

		target[b] = target[b] & m0;
		target[b+1] = target[b+1] & m1;

		target[b] = target[b] | v0;
		target[b+1] = target[b+1] | v1;
	}

	function r2(target, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;

		// bitsize = 2 , writer
		// xy 00 00 00
		// 0x y0 00 00
		// 00 xy 00 00
		// 00 0x y0 00
		// 00 00 xy 00
		// 00 00 0x y0
		// 00 00 00 xy
		// 00 00 00 0x | y0 00 00 00		

		// bitsize = 9
		// ab cd ef gh | i0 00 00 00	
		// 0a bc de fg | hi 00 00 00
		// 00 ab cd ef | gh i0 00 00
		// 00 0a bc de | fg hi 00 00
		// 00 00 ab cd | ef gh i0 00
		// 00 00 0a bc | de fg hi 00
		// 00 00 00 ab | cd ef gh i0
		// 00 00 00 0a | bc de fg hi


		var vv = (target[b] << 8) + target[b+1];
		var sh = 16 - (i + bs);
		var mm = 65535 >> i;
		vv = vv & mm;
		vv = vv >> sh;
		return vv;
	}

	// bitsize = 10
	// bitoffset = 0: v0 = v >> 2;	v1 = (v % 4) << 6;
	// ab cd ef gh | ij 00 00 00 | 00 00 00 00
	
	// bitoffset = 1: v0 = v >> 3;	v1 = (v % 8) << 5;				
	// 0a bc de fg | hi j0 00 00 | 00 00 00 00
	
	// bitoffset = 2: v0 = v >> 4;	v1 = (v % 16) << 4;				
	// 00 ab cd ef | gh ij 00 00 | 00 00 00 00
	
	// bitoffset = 3: v0 = v >> 5;	v1 = (v % 32) << 3;				
	// 00 0a bc de | fg hi j0 00 | 00 00 00 00
	
	// bitoffset = 4: v0 = v >> 6;	v1 = (v % 64) << 2;				
	// 00 00 ab cd | ef gh ij 00 | 00 00 00 00
	
	// bitoffset = 5: v0 = v >> 7;	v1 = (v % 128) << 1;				
	// 00 00 0a bc | de fg hi j0 | 00 00 00 00
	
	// bitoffset = 6: v0 = v >> 8;	v1 = (v % 256) << 0;				
	// 00 00 00 ab | cd ef gh ij | 00 00 00 00
	
	// bitoffset = 7: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7;	
	// 00 00 00 0a | bc de fg hi | j0 00 00 00
	

	// bitsize = 11
	// bitoffset = 0: v0 = v >> 3;	v1 = (v % 8) << 5;				
	// ab cd ef gh | ij k0 00 00 | 00 00 00 00
	
	// bitoffset = 1: v0 = v >> 4;	v1 = (v % 16) << 4;				
	// 0a bc de fg | hi jk 00 00 | 00 00 00 00
	
	// bitoffset = 2: v0 = v >> 5;	v1 = (v % 32) << 3;				
	// 00 ab cd ef | gh ij k0 00 | 00 00 00 00
	
	// bitoffset = 3: v0 = v >> 6;	v1 = (v % 64) << 2;				
	// 00 0a bc de | fg hi jk 00 | 00 00 00 00
	
	// bitoffset = 4: v0 = v >> 7;	v1 = (v % 128) << 1;				
	// 00 00 ab cd | ef gh ij k0 | 00 00 00 00
	
	// bitoffset = 5: v0 = v >> 8;	v1 = (v % 256) << 0;				
	// 00 00 0a bc | de fg hi jk | 00 00 00 00
	
	// bitoffset = 6: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7;	
	// 00 00 00 ab | cd ef gh ij | k0 00 00 00
	
	// bitoffset = 7: v0 = v >> 10;	v1 = ((v >> 2) % 256);	v2 = (v % 4) << 6;	
	// 00 00 00 0a | bc de fg hi | jk 00 00 00


	// bitsize = 12
	// bitoffset = 0: v0 = v >> 4;	v1 = (v % 16) << 4;				
	// ab cd ef gh | ij kl 00 00 | 00 00 00 00
	
	// bitoffset = 1: v0 = v >> 5;	v1 = (v % 32) << 3;				
	// 0a bc de fg | hi jk l0 00 | 00 00 00 00
	
	// bitoffset = 2: v0 = v >> 6;	v1 = (v % 64) << 2;				
	// 00 ab cd ef | gh ij kl 00 | 00 00 00 00
	
	// bitoffset = 3: v0 = v >> 7;	v1 = (v % 128) << 1;				
	// 00 0a bc de | fg hi jk l0 | 00 00 00 00
	
	// bitoffset = 4: v0 = v >> 8;	v1 = (v % 256) << 0;				
	// 00 00 ab cd | ef gh ij kl | 00 00 00 00
	
	// bitoffset = 5: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7;	
	// 00 00 0a bc | de fg hi jk | l0 00 00 00
	
	// bitoffset = 6: v0 = v >> 10;	v1 = ((v >> 2) % 256);	v2 = (v % 4) << 6;	
	// 00 00 00 ab | cd ef gh ij | kl 00 00 00
	
	// bitoffset = 7: v0 = v >> 11;	v1 = ((v >> 3) % 256);	v2 = (v % 8) << 5;	
	// 00 00 00 0a | bc de fg hi | jk l0 00 00


	// bitsize = 13
	// bitoffset = 0: v0 = v >> 5;	v1 = (v % 32) << 3;				
	// ab cd ef gh | ij kl m0 00 | 00 00 00 00
	
	// bitoffset = 1: v0 = v >> 6;	v1 = (v % 64) << 2;				
	// 0a bc de fg | hi jk lm 00 | 00 00 00 00
	
	// bitoffset = 2: v0 = v >> 7;	v1 = (v % 128) << 1;				
	// 00 ab cd ef | gh ij kl m0 | 00 00 00 00
	
	// bitoffset = 3: v0 = v >> 8;	v1 = (v % 256) << 0;				
	// 00 0a bc de | fg hi jk lm | 00 00 00 00
	
	// bitoffset = 4: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7	
	// 00 00 ab cd | ef gh ij kl | m0 00 00 00
	
	// bitoffset = 5: v0 = v >> 10;	v1 = ((v >> 2) % 256);	v2 = (v % 4) << 6	
	// 00 00 0a bc | de fg hi jk | lm 00 00 00
	
	// bitoffset = 6: v0 = v >> 11;	v1 = ((v >> 3) % 256);	v2 = (v % 8) << 5	
	// 00 00 00 ab | cd ef gh ij | kl m0 00 00
	
	// bitoffset = 7: v0 = v >> 12;	v1 = ((v >> 4) % 256);	v2 = (v % 16) << 4;	
	// 00 00 00 0a | bc de fg hi | jk lm 00 00


	// ...
	// ..
	// this goes up to bitsize = 17

	// bitsize = 17
	// bitoffset = 0: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7;	
	// ab cd ef gh | ij kl mn pq | r0 00 00 00
	
	// bitoffset = 1: v0 = v >> 10;	v1 = ((v >> 2) % 256);	v2 = (v % 4) << 6;	
	// 0a bc de fg | hi jk lm np | qr 00 00 00
	
	// bitoffset = 2: v0 = v >> 11;	v1 = ((v >> 3) % 256);	v2 = (v % 8) << 5;	
	// 00 ab cd ef | gh ij kl mn | pq r0 00 00
	
	// bitoffset = 3: v0 = v >> 12;	v1 = ((v >> 4) % 256);	v2 = (v % 16) << 4;	
	// 00 0a bc de | fg hi jk lm | np qr 00 00
	
	// bitoffset = 4: v0 = v >> 13;	v1 = ((v >> 5) % 256);	v2 = (v % 32) << 3;	
	// 00 00 ab cd | ef gh ij kl | mn pq r0 00
	
	// bitoffset = 5: v0 = v >> 14;	v1 = ((v >> 6) % 256);	v2 = (v % 64) << 2;	
	// 00 00 0a bc | de fg hi jk | lm np qr 00
	
	// bitoffset = 6: v0 = v >> 15;	v1 = ((v >> 7) % 256);	v2 = (v % 128) << 1;	
	// 00 00 00 ab | cd ef gh ij | kl mn pq r0
	
	// bitoffset = 7: v0 = v >> 16;	v1 = ((v >> 8) % 256);	v2 = (v % 256) << 0;	
	// 00 00 00 0a | bc de fg hi | jk lm np qr


	// bitsize = 10
	// bitoffset = 0: v0 = v >> 2;	v1 = (v % 4) << 6;				
	// bitoffset = 1: v0 = v >> 3;	v1 = (v % 8) << 5;				
	// bitoffset = 2: v0 = v >> 4;	v1 = (v % 16) << 4;				
	// bitoffset = 3: v0 = v >> 5;	v1 = (v % 32) << 3;				
	// bitoffset = 4: v0 = v >> 6;	v1 = (v % 64) << 2;				
	// bitoffset = 5: v0 = v >> 7;	v1 = (v % 128) << 1;				
	// bitoffset = 6: v0 = v >> 8;	v1 = (v % 256) << 0;				
	// bitoffset = 7: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7;

	// bitsize = 17
	// bitoffset = 0: v0 = v >> 9;	v1 = ((v >> 1) % 256);	v2 = (v % 2) << 7;	
	// bitoffset = 1: v0 = v >> 10;	v1 = ((v >> 2) % 256);	v2 = (v % 4) << 6;	
	// bitoffset = 2: v0 = v >> 11;	v1 = ((v >> 3) % 256);	v2 = (v % 8) << 5;	
	// bitoffset = 3: v0 = v >> 12;	v1 = ((v >> 4) % 256);	v2 = (v % 16) << 4;	
	// bitoffset = 4: v0 = v >> 13;	v1 = ((v >> 5) % 256);	v2 = (v % 32) << 3;	
	// bitoffset = 5: v0 = v >> 14;	v1 = ((v >> 6) % 256);	v2 = (v % 64) << 2;	
	// bitoffset = 6: v0 = v >> 15;	v1 = ((v >> 7) % 256);	v2 = (v % 128) << 1;	
	// bitoffset = 7: v0 = v >> 16;	v1 = ((v >> 8) % 256);	v2 = (v % 256) << 0;	

	function w3(target, v, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var v0 = 0;
		var v1 = 0;
		var v2 = 0;
		var m0 = 255;
		var m1 = 255;
		var m2 = 255;

		m0 = 255 - (255 >> i)
		v0 = v >> (bs + i - 8);
		
		if (bs + i <= 16)
		{
			v1 = (v % Math.pow(2, bs + i - 8)) << (16 - bs - i);
			m1 = 255 - ( (255 >> (16 - (bs+i))) << (16 - (bs+i)))
		}
		else
		{
			v1 = (v >> (bs + i - 16)) % 256;
			v2 = (v % Math.pow(2, bs + i - 16)) << (24 - bs - i);

			m1 = 0
			m2 = 255 - (255 >> (24 - (bs + i))) << (24 - (bs + i))
		}

		target[b] = target[b] & m0;
		target[b+1] = target[b+1] & m1;
		target[b+2] = target[b+2] & m2;

		target[b] = target[b] | v0;
		target[b+1] = target[b+1] | v1;
		target[b+2] = target[b+2] | v2;
	}

	function r3(target, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;

		// bitsize = 10 				// bitsize = 17
		// ab cd ef gh | ij 00 00 00 | 00 00 00 00 	// ab cd ef gh | ij kl mn pq | r0 00 00 00
		// 0a bc de fg | hi j0 00 00 | 00 00 00 00 	// 0a bc de fg | hi jk lm np | qr 00 00 00
		// 00 ab cd ef | gh ij 00 00 | 00 00 00 00 	// 00 ab cd ef | gh ij kl mn | pq r0 00 00
		// 00 0a bc de | fg hi j0 00 | 00 00 00 00 	// 00 0a bc de | fg hi jk lm | np qr 00 00
		// 00 00 ab cd | ef gh ij 00 | 00 00 00 00 	// 00 00 ab cd | ef gh ij kl | mn pq r0 00
		// 00 00 0a bc | de fg hi j0 | 00 00 00 00 	// 00 00 0a bc | de fg hi jk | lm np qr 00
		// 00 00 00 ab | cd ef gh ij | 00 00 00 00 	// 00 00 00 ab | cd ef gh ij | kl mn pq r0
		// 00 00 00 0a | bc de fg hi | j0 00 00 00 	// 00 00 00 0a | bc de fg hi | jk lm np qr

		var vv = (target[b] << 16) + (target[b+1] << 8) + target[b+2];
		var sh = 24 - (i + bs);
		var mm = 16777215 >> i;
		vv = vv & mm;
		vv = vv >> sh;
		return vv;
	}

	// bitsize = 18

	// bitoffset = 0: v0 = v >> 10;	v1 = ((v >> 2) % 256);	v2 = (v % 4) << 6;	
	// ab cd ef gh | ij kl mn pq | rs 00 00 00 | 00 00 00 00
	
	// bitoffset = 1: v0 = v >> 11;	v1 = ((v >> 3) % 256);	v2 = (v % 8) << 5;	
	// 0a bc de fg | hi jk lm np | qr s0 00 00 | 00 00 00 00
	
	// bitoffset = 2: v0 = v >> 12;	v1 = ((v >> 4) % 256);	v2 = (v % 16) << 4;	
	// 00 ab cd ef | gh ij kl mn | pq rs 00 00 | 00 00 00 00
	
	// bitoffset = 3: v0 = v >> 13;	v1 = ((v >> 5) % 256);	v2 = (v % 32) << 3;	
	// 00 0a bc de | fg hi jk lm | np qr s0 00 | 00 00 00 00
	
	// bitoffset = 4: v0 = v >> 14;	v1 = ((v >> 6) % 256);	v2 = (v % 64) << 2;	
	// 00 00 ab cd | ef gh ij kl | mn pq rs 00 | 00 00 00 00
	
	// bitoffset = 5: v0 = v >> 15;	v1 = ((v >> 7) % 256);	v2 = (v % 128) << 1;	
	// 00 00 0a bc | de fg hi jk | lm np qr s0 | 00 00 00 00
	
	// bitoffset = 6: v0 = v >> 16;	v1 = ((v >> 8) % 256);	v2 = (v % 256) << 0;	
	// 00 00 00 ab | cd ef gh ij | kl mn pq rs | 00 00 00 00
	
	// bitoffset = 7: v0 = v >> 17;	v1 = ((v >> 9) % 256);	v2 = (v >> 1) % 256;	v3 = (v % 2) << 7	
	// 00 00 00 0a | bc de fg hi | jk lm np qr | s0 00 00 00	


	// ...
	// ..
	// this goes up to bitsize = 25	

	// bitsize = 25
	// bitoffset = 0: v0 = v >> 17;	v1 = ((v >> 9) % 256);	v2 = (v >> 1) % 256;	v3 = (v % 2) << 7
	// ab cd ef gh | ij kl mn pq | rs tu vw xy | z0 00 00 00
	
	// bitoffset = 1: v0 = v >> 18;	v1 = ((v >> 10) % 256);	v2 = (v >> 2) % 256;	v3 = (v % 4) << 6
	// 0a bc de fg | hi jk lm np | qr st uv wx | yz 00 00 00
	
	// bitoffset = 7: v0 = v >> 24;	v1 = ((v >> 16) % 256);	v2 = (v >> 8) % 256;	v3 = (v % 256) << 0
	// 00 00 00 0a | bc de fg hi | jk lm np qr | st uv wx yz

	function w4(target, v, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var v0 = 0;
		var v1 = 0;
		var v2 = 0;
		var v3 = 0;
		var m0 = 255;
		var m1 = 255;
		var m2 = 255;
		var m3 = 255;

		v0 = v >> (bs + i - 8);
		v1 = (v >> (bs + i - 16)) % 256;

		m0 = 255 - (255 >> i);
		m1 = 0;

		if (bs + i <= 24)
		{
			v2 = (v % Math.pow(2, bs + i - 8)) << (24 - bs - i);
			m2 = 255 - ((255 >> (24 - bs - i))  << (24 - bs - i));
		}
		else
		{
			v2 = (v >> (bs + i - 24)) % 256;
			v3 = (v % Math.pow(2, bs + i - 24)) << (32 - bs - i);

			m2 = 0;
			m3 = 255 - ((255 >> (32 - (bs + i))) << (32 - (bs + i)));
		}

		target[b] = target[b] & m0;
		target[b+1] = target[b+1] & m1;
		target[b+2] = target[b+2] & m2;
		target[b+3] = target[b+3] & m3;

		target[b] = target[b] | v0;
		target[b+1] = target[b+1] | v1;
		target[b+2] = target[b+2] | v2;
		target[b+3] = target[b+3] | v3;
	}

	function r4(target, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		// bitsize = 18							// bitsize = 25
		// ab cd ef gh | ij kl mn pq | rs 00 00 00 | 00 00 00 00	// ab cd ef gh | ij kl mn pq | rs tu vw xy | z0 00 00 00
		// 0a bc de fg | hi jk lm np | qr s0 00 00 | 00 00 00 00
		// 00 ab cd ef | gh ij kl mn | pq rs 00 00 | 00 00 00 00
		// 00 0a bc de | fg hi jk lm | np qr s0 00 | 00 00 00 00
		// 00 00 ab cd | ef gh ij kl | mn pq rs 00 | 00 00 00 00
		// 00 00 0a bc | de fg hi jk | lm np qr s0 | 00 00 00 00
		// 00 00 00 ab | cd ef gh ij | kl mn pq rs | 00 00 00 00
		// 00 00 00 0a | bc de fg hi | jk lm np qr | s0 00 00 00	// 00 00 00 0a | bc de fg hi | jk lm np qr | st uv wx yz


		// note that in javascript, 'Bitwise operators treat their operands as a sequence of 32 bits'
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators

		var vv = ((target[b] << 22) * 4) + (target[b+1] << 16) + (target[b+2] << 8 ) + target[b+3];
		if ((vv > 2147483648) && i > 0) vv -= 2147483648; // 2147483648 -> 2^31 
		if ((vv > 1073741824) && i > 1) vv -= 1073741824; // 1073741824 -> 2^30 
		if ((vv > 536870912) && i > 2) vv -= 536870912; // 536870912 -> 2^29 
		if ((vv > 268435456) && i > 3) vv -= 268435456; // 268435456 -> 2^28 
		if ((vv > 134217728) && i > 4) vv -= 134217728; // 134217728 -> 2^27 
		if ((vv > 67108864) && i > 5) vv -= 67108864; // 67108864 -> 2^26 
		if ((vv > 33554432) && i > 6) vv -= 33554432; // 33554432 -> 2^25 

		var sh = 32 - (i + bs);
		vv = (vv / (1 << sh)) | 0;

		return vv;

	}
})(bitpack || (bitpack = {}));


function bitstream(stream)
{
	var self = this;
	self.stream = stream;
	self.readCursor = 0;
	self.writeCursor = 0;

	self.read = function(bitsize)
	{
		var v = bitpack.read(self.stream, self.readCursor, bitsize);
		self.readCursor += bitsize;
		return v;
	}

	self.write = function(value, bitsize)
	{
		bitpack.write(self.stream, value, self.writeCursor, bitsize);
		self.writeCursor += bitsize;
	}
}