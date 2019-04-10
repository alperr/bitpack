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
			v0 = v << (8 - bs - i)
		}
		else
		{
			v0 = v >> (bs + i - 8);
			v1 = (v % Math.pow(2, (bs + i - 8))) << (16 - bs - i);
		}

		target[b] = target[b] & m0;
		target[b+1] = target[b+1] & m1;

		target[b] = target[b] | v0;
		target[b+1] = target[b+1] | v1;
	}

	function r2(target, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var m0 = 255;
		var m1 = 255;
		var s0 = 0;
		var s1 = 0;

		// bitsize = 2 , writer
		// xy 00 00 00
		// 0x y0 00 00
		// 00 xy 00 00
		// 00 0x y0 00
		// 00 00 xy 00
		// 00 00 0x y0
		// 00 00 00 xy
		// 00 00 00 0x | y0 00 00 00		

		// bitsize = 2 , reader
		// bitoffset = 0: m0 = 192; s0 = 6; 			// (255 >> 6) << 6 | 
		// bitoffset = 1: m0 = 96; s0 = 5;  			// (255 >> 6) << 5 | 
		// bitoffset = 2: m0 = 48; s0 = 4;  			// (255 >> 6) << 4 | 
		// bitoffset = 3: m0 = 24; s0 = 3;  			// (255 >> 6) << 3 | 
		// bitoffset = 4: m0 = 12; s0 = 2;  			// (255 >> 6) << 2 | 
		// bitoffset = 5: m0 = 6; s0 = 1;   			// (255 >> 6) << 1 | 
		// bitoffset = 6: m0 = 3; s0 = 0;   			// (255 >> 6) << 0 | 
		// bitoffset = 7: m0 = 1; s0 = -1; m1 = 128; s1 = 7	// (255 >> 6) >> 1 |  (255 << 7) % 256

		// bitsize = 3, writer
		// xy z0 00 00
		// 0x yz 00 00
		// 00 xy z0 00
		// 00 0x yz 00
		// 00 00 xy z0
		// 00 00 0x yz
		// 00 00 00 xy | z0 00 00 00
		// 00 00 00 0x | yz 00 00 00

		// bitsize = 3, reader
		// bitoffset = 0: m0 = 224; s0 = 5;			(255 >> 5) << 5
		// bitoffset = 1: m0 = 112; s0 = 4;			(255 >> 5) << 4
		// bitoffset = 2: m0 = 56; s0 = 3;			(255 >> 5) << 3
		// bitoffset = 3: m0 = 28; s0 = 2;			(255 >> 5) << 2
		// bitoffset = 4: m0 = 14; s0 = 1;			(255 >> 5) << 1
		// bitoffset = 5: m0 = 7; s0 = 0;			(255 >> 5) << 0
		// bitoffset = 6: m0 = 3; s0 = -1; m1 = 128; s1 = 7	(255 >> 5) >> 1 | (255 << 7) % 256
		// bitoffset = 7: m0 = 1; s0 = -2; m1 = 192; s1 = 6	(255 >> 5) >> 2 | (255 << 6) % 256 

		// bitsize = 5
		// xy zt u0 00
		// 0x yz tu 00
		// 00 xy zt u0
		// 00 0x yz tu
		// 00 00 xy zt | u0 00 00 00
		// 00 00 0x yz | tu 00 00 00
		// 00 00 00 xy | zt u0 00 00
		// 00 00 00 0x | yz tu 00 00		
		
		// bitsize = 5, reader
		// bitoffset = 0: m0 = 248; s0 = 3;			(255 >> 3) << 3
		// bitoffset = 1: m0 = 124; s0 = 2;			(255 >> 3) << 2
		// bitoffset = 2: m0 = 62; s0 = 1;			(255 >> 3) << 1
		// bitoffset = 3: m0 = 31; s0 = 0;			(255 >> 3) << 0
		// bitoffset = 4: m0 = 15; s0 = -1; m1 = 128; s1 = 7 	(255 >> 3) >> 1 | (255 << 7) % 256
		// bitoffset = 5: m0 = 7; s0 = -2;  m1 = 192; s1 = 6	(255 >> 3) >> 2 | (255 << 6) % 256
		// bitoffset = 6: m0 = 3; s0 = -3;  m1 = 224; s1 = 5	(255 >> 3) >> 3 | (255 << 5) % 256
		// bitoffset = 7: m0 = 1; s0 = -4;  m1 = 240; s1 = 4	(255 >> 3) >> 4 | (255 << 4) % 256

		// bitsize = 9
		// ab cd ef gh | i0 00 00 00	
		// 0a bc de fg | hi 00 00 00
		// 00 ab cd ef | gh i0 00 00
		// 00 0a bc de | fg hi 00 00
		// 00 00 ab cd | ef gh i0 00
		// 00 00 0a bc | de fg hi 00
		// 00 00 00 ab | cd ef gh i0
		// 00 00 00 0a | bc de fg hi
		
		// bitoffset = 0: m0 = 255; s0 = 0; m1 = 128; s1 = 7;		(255 >> 0) << 0 | (255 << 7) % 256
		// bitoffset = 1: m1 = 127; s0 = -1; m1 = 192; s1 = 6;		(255 >> 0) >> 1 | (255 << 6) % 256
		// bitoffset = 2: m1 = 63; s0 = -2; m1 = 224; s1 = 5;		(255 >> 0) >> 2 | (255 << 5) % 256
		// bitoffset = 3: m1 = 31; s0 = -3; m1 = 240; s1 = 4;		(255 >> 0) >> 3 | (255 << 4) % 256
		// bitoffset = 4: m1 = 15; s0 = -4; m1 = 248; s1 = 3;		(255 >> 0) >> 4 | (255 << 3) % 256
		// bitoffset = 5: m1 = 7; s0 = -5; m1 = 252; s1 = 2;		(255 >> 0) >> 5 | (255 << 2) % 256
		// bitoffset = 6: m1 = 3; s0 = -6; m1 = 254; s1 = 1;		(255 >> 0) >> 6 | (255 << 1) % 256
		// bitoffset = 7: m1 = 1; s0 = -7; m1 = 255; s1 = 0;		(255 >> 0) >> 7 | (255 << 0) % 256

		if (bs + i <= 8)
		{
			m0 = (255 >> (8 - (bs))) << (8 - (bs + i))
			s0 = 8 - (bs + i);
		}
		else
		{
			m0 = (255 >> (8 - (bs))) >> ((bs + i) - 8)
			s0 = 8 - (bs + i);
			m1 = (255 << (16 - (bs + i))) % 256;
			s1 = 16 - (bs + i);
		}

		// console.log(target);
		// console.log(i);
		// console.log(bs);
		// console.log(m0);
		// console.log(s0);

		var v0,v1;
		if (s0 > 0) v0 = (target[b] & m0) >> s0;
		else v0 = (target[b] & m0) << s0;
		
		if (s1 > 0) v1 = (target[b+1] & m1) >> s1;
		else v1 = (target[b+1] & m1) << s1;

		// console.log(v0);
		// console.log(v1);

		return v0 + (v1 << 8);
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

		v0 = v >> (bs + i - 8);
		if (bs + i <= 16)
		{
			v1 = (v % Math.pow(2, bs + i - 8)) << (16 - bs - i);
		}
		else
		{
			v1 = (v >> (bs + i - 16)) % 256;
			v2 = (v % Math.pow(2, bs + i - 16)) << (24 - bs - i);
		}

		target[b] = target[b] | v0;
		target[b+1] = target[b+1] | v1;
		target[b+2] = target[b+2] | v2;
	}

	function r3(target, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var m0 = 255;
		var m1 = 255;
		var m2 = 255;
		var s0 = 0;
		var s1 = 0;
		var s2 = 0;

		// bitsize = 10
		// ab cd ef gh | ij 00 00 00 | 00 00 00 00
		// 0a bc de fg | hi j0 00 00 | 00 00 00 00
		// 00 ab cd ef | gh ij 00 00 | 00 00 00 00
		// 00 0a bc de | fg hi j0 00 | 00 00 00 00
		// 00 00 ab cd | ef gh ij 00 | 00 00 00 00
		// 00 00 0a bc | de fg hi j0 | 00 00 00 00
		// 00 00 00 ab | cd ef gh ij | 00 00 00 00
		// 00 00 00 0a | bc de fg hi | j0 00 00 00

		// i = 0: m0 = 255; s0 = 0; m1 = 192; s1 = 6;                       (255) >> 0 | (255 >> 6) << 6
		// i = 1: m0 = 127; s0 = 1; m1 = 224; s1 = 5;                       (255) >> 1 | (255 >> 5) << 5
		// i = 2: m0 = 63; s0 = 2; m1 = 240; s1 = 4;                        (255) >> 2 | (255 >> 4) << 4
		// i = 3: m0 = 31; s0 = 3; m1 = 248; s1 = 3;                        (255) >> 3 | (255 >> 3) << 3
		// i = 4: m0 = 15; s0 = 4; m1 = 252; s1 = 2;                        (255) >> 4 | (255 >> 2) << 2
		// i = 5: m0 = 7; s0 = 5;  m1 = 254; s1 = 1;                        (255) >> 5 | (255 >> 1) << 1
		// i = 6: m0 = 3; s0 = 6;  m1 = 255; s1 = 0;                        (255) >> 6 | (255 >> 0) << 0
		// i = 7: m0 = 1; s0 = 7;  m1 = 255; s1 = 0;  m2 = 128; s2 = 7;     (255) >> 7 | (255 >> 0) << 0    (255 >> 7) << 7

		// bitsize = 17
		// ab cd ef gh | ij kl mn pq | r0 00 00 00
		// 0a bc de fg | hi jk lm np | qr 00 00 00
		// 00 ab cd ef | gh ij kl mn | pq r0 00 00
		// 00 0a bc de | fg hi jk lm | np qr 00 00
		// 00 00 ab cd | ef gh ij kl | mn pq r0 00
		// 00 00 0a bc | de fg hi jk | lm np qr 00
		// 00 00 00 ab | cd ef gh ij | kl mn pq r0
		// 00 00 00 0a | bc de fg hi | jk lm np qr

		// i = 0: m0 = 255; s0 = 0; m1 = 255; s1 = 0;  m2 = 128; s2 = 7; 	(255) >> 0 | 255 | (255 >> 7) << 7
		// i = 1: m0 = 127; s0 = 1; m1 = 255; s1 = 0;  m2 = 192; s2 = 6; 	(255) >> 1 | 255 | (255 >> 6) << 6
		// i = 2: m0 = 63; s0 = 2;  m1 = 255; s1 = 0;  m2 = 224; s2 = 5; 	(255) >> 2 | 255 | (255 >> 5) << 5
		// i = 3: m0 = 31; s0 = 3;  m1 = 255; s1 = 0;  m2 = 240; s2 = 4; 	(255) >> 3 | 255 | (255 >> 4) << 4
		// i = 4: m0 = 15; s0 = 4;  m1 = 255; s1 = 0;  m2 = 248; s2 = 3; 	(255) >> 4 | 255 | (255 >> 3) << 3
		// i = 5: m0 = 7; s0 = 5;   m1 = 255; s1 = 0;  m2 = 252; s2 = 2; 	(255) >> 5 | 255 | (255 >> 2) << 2
		// i = 6: m0 = 3; s0 = 6;   m1 = 255; s1 = 0;  m2 = 254; s2 = 1; 	(255) >> 6 | 255 | (255 >> 1) << 1
		// i = 7: m0 = 1; s0 = 7;   m1 = 255; s1 = 0;  m2 = 255; s2 = 0; 	(255) >> 7 | 255 | (255 >> 0) << 0

		m0 = (255 >> i)
		s0 = i

		if (bs + i <= 16)
		{
			m1 = (255 >> (16 - (bs+i))) >> (16 - (bs+i))
			s1 = 16 - (bs+i)
		}
		else
		{
			m1 = 255
			s1 = 0
			m2 = (255 >> (24 - (bs + i))) << (24 - (bs + i))
			s2 = 24 - (bs+i)
		}

		var v0, v1, v2;
		if (s0 > 0) v0 = (target[b] & m0) >> s0;
		else v0 = (target[b] & m0) << s0;
		
		if (s1 > 0) v1 = (target[b+1] & m1) >> s1;
		else v1 = (target[b+1] & m1) << s1;

		if (s2 > 0) v2 = (target[b+2] & m2) >> s2;
		else v2 = (target[b+2] & m2) << s2;

		return (v0 << 16) + (v1 << 8) + v2;
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

		v0 = v >> (bs + i - 8);
		v1 = (v >> (bs + i - 16)) % 256;

		if (bs + i <= 24)
		{
			v2 = (v % Math.pow(2, bs + i - 8)) << (16 - bs - i);
		}
		else
		{
			v2 = (v >> (bs + i - 24)) % 256;
			v3 = (v % Math.pow(2, bs + i - 24)) << (32 - bs - i);
		}

		target[b] = target[b] | v0;
		target[b+1] = target[b+1] | v1;
		target[b+2] = target[b+2] | v2;
		target[b+3] = target[b+3] | v3;
	}

	function r4(target, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var m0 = 255;
		var m1 = 255;
		var m2 = 255;
		var m3 = 255;
		var s0 = 0;
		var s1 = 0;
		var s2 = 0;
		var s3 = 0;

		// bitsize = 18

		// ab cd ef gh | ij kl mn pq | rs 00 00 00 | 00 00 00 00
		// 0a bc de fg | hi jk lm np | qr s0 00 00 | 00 00 00 00
		// 00 ab cd ef | gh ij kl mn | pq rs 00 00 | 00 00 00 00
		// 00 0a bc de | fg hi jk lm | np qr s0 00 | 00 00 00 00
		// 00 00 ab cd | ef gh ij kl | mn pq rs 00 | 00 00 00 00
		// 00 00 0a bc | de fg hi jk | lm np qr s0 | 00 00 00 00
		// 00 00 00 ab | cd ef gh ij | kl mn pq rs | 00 00 00 00
		// 00 00 00 0a | bc de fg hi | jk lm np qr | s0 00 00 00

		// i = 0: m0 = 255; s0 = 0; 	m1= 255; s1 = 0; m2 = 192; s2 = 6;                        (255) >> 0 | 255| (255 >> 6) << 6
		// i = 1: m0 = 127; s0 = 1; 	m1= 255; s1 = 0; m2 = 224; s2 = 5;                        (255) >> 1 | 255| (255 >> 5) << 5
		// i = 2: m0 = 63; s0 = 2; 	m1= 255; s1 = 0; m2 = 240; s2 = 4;                        (255) >> 2 | 255| (255 >> 4) << 4
		// i = 3: m0 = 31; s0 = 3; 	m1= 255; s1 = 0; m2 = 248; s2 = 3;                        (255) >> 3 | 255| (255 >> 3) << 3
		// i = 4: m0 = 15; s0 = 4; 	m1= 255; s1 = 0; m2 = 252; s2 = 2;                        (255) >> 4 | 255| (255 >> 2) << 2
		// i = 5: m0 = 7; s0 = 5; 	m1= 255; s1 = 0; m2 = 254; s2 = 1;                        (255) >> 5 | 255| (255 >> 1) << 1
		// i = 6: m0 = 3; s0 = 6; 	m1= 255; s1 = 0; m2 = 255; s2 = 0;                        (255) >> 6 | 255| (255 >> 0) << 0
		// i = 7: m0 = 1; s0 = 7; 	m1= 255; s1 = 0; m2 = 255; s2 = 0;  m3 = 128; s3 = 7;     (255) >> 7 | 255| (255 >> 0) << 0    (255 >> 7) << 7

		// bitsize = 25
		// ab cd ef gh | ij kl mn pq | rs tu vw xy | z0 00 00 00
		// 00 00 00 0a | bc de fg hi | jk lm np qr | st uv wx yz

		// i = 0: m0 = 255; s0 = 0; m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 128; s3 = 7; 	(255) >> 0 | 255 | 255 | (255 >> 7) << 7
		// i = 1: m0 = 127; s0 = 1; m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 192; s3 = 6; 	(255) >> 1 | 255 | 255 | (255 >> 6) << 6
		// i = 2: m0 = 63; s0 = 2;  m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 224; s3 = 5; 	(255) >> 2 | 255 | 255 | (255 >> 5) << 5
		// i = 3: m0 = 31; s0 = 3;  m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 240; s3 = 4; 	(255) >> 3 | 255 | 255 | (255 >> 4) << 4
		// i = 4: m0 = 15; s0 = 4;  m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 248; s3 = 3; 	(255) >> 4 | 255 | 255 | (255 >> 3) << 3
		// i = 5: m0 = 7; s0 = 5;   m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 252; s3 = 2; 	(255) >> 5 | 255 | 255 | (255 >> 2) << 2
		// i = 6: m0 = 3; s0 = 6;   m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 254; s3 = 1; 	(255) >> 6 | 255 | 255 | (255 >> 1) << 1
		// i = 7: m0 = 1; s0 = 7;   m1 = 255; s1 = 0; m2 = 255; s2 = 0; m3 = 255; s3 = 0; 	(255) >> 7 | 255 | 255 | (255 >> 0) << 0

		m0 = (255 >> i)
		s0 = i
		m1 = 255
		s1 = 0

		if (bs + i <= 24)
		{
			m2 = (255 >> (24 - (bs+i))) >> (24 - (bs+i))
			s2 = 24 - (bs+i)
		}
		else
		{
			m2 = 255
			s2 = 0
			m3 = (255 >> (32 - (bs + i))) << (32 - (bs + i))
			s3 = 32 - (bs+i)
		}

		var v0, v1, v2, v3;
		if (s0 > 0) v0 = (target[b] & m0) >> s0;
		else v0 = (target[b] & m0) << s0;
		
		if (s1 > 0) v1 = (target[b+1] & m1) >> s1;
		else v1 = (target[b+1] & m1) << s1;

		if (s2 > 0) v2 = (target[b+2] & m2) >> s2;
		else v2 = (target[b+2] & m2) << s2;

		if (s3 > 0) v3 = (target[b+3] & m3) >> s3;
		else v3 = (target[b+3] & m3) << s3;

		return (v0 << 24) + (v1 << 16) + (v2 << 8) + v3;
	}
})(bitpack || (bitpack = {}));

var target = new Uint8Array(4);
// bitpack.write(target, 509, 0, 9);
bitpack.write(target, 7, 0, 3);
bitpack.write(target, 5, 3, 3);

var v = bitpack.read(target, 0, 3);
// console.log(target);
console.log(v);

// for (var i=0;i<4;i++) visualize(target[i]);


function visualizeArray(arr)
{
	for (var i=0;i<arr.length;i++) visualize(arr[i]);
}
function visualize(byte)
{
	var s = "";
	for (var i=7;i>-1;i--)
	{
		if (i % 2 == 1)
			s+= " ";
		s = s + "" + ((byte & Math.pow(2, i)) / Math.pow(2, i));
	}
	console.log(s);
}

test();

function test()
{
	var counter = 0;
	var target = new Uint8Array(16);
	for (var bs=1;bs<3;bs++)
	{
		for (var v=0;v<Math.pow(2,bs);v++)
		{
			for (var offset=0;offset<8;offset++)
			{
				bitpack.write(target, v, offset, bs);
				var v2 = bitpack.read(target, offset, bs);
				if (v == v2)
				{
					counter++;
					console.log("ok");
				}
				else
				{
					console.log("fail");
					console.log("value written " + v);
					console.log("value read " + v2);
					console.log("bitsize " + bs);
					console.log("offset " + offset);

					visualizeArray(target);
					process.exit();
				}
			}
		}
	}
}