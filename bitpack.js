var bitpack;
(function (bitpack)
{
	function write(target, value, offset, bitsize)
	{
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
		f(target, offset, bitsize);
	}

	bitpack.write = write;
	bitpack.read = read;

	// bittofset = 0: v0 = v << 7;	// x0 00 00 00
	// bittofset = 1: v0 = v << 6;	// 0x 00 00 00
	// bittofset = 2: v0 = v << 5;	// 00 x0 00 00
	// bittofset = 3: v0 = v << 4;	// 00 0x 00 00
	// bittofset = 4: v0 = v << 3;	// 00 00 x0 00
	// bittofset = 5: v0 = v << 2;	// 00 00 0x 00
	// bittofset = 6: v0 = v << 1;	// 00 00 00 x0
	// bittofset = 7: v0 = v << 0;	// 00 00 00 0x

	// b -> byte offset
	// i -> bit offset
	function w1(target, v, o)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var v0 = v << (7 - i);
		target[b] = target[b] | v0;
	}

	function r1(target, o)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var m = 1 << (7 - i);
		var s = 7 - i;

		// switch(i)
		// {
		// 	case 0: m = 128; s = 7; break;
		// 	case 1: m = 64; s = 6; break;
		// 	case 2: m = 32; s = 5; break;
		// 	case 3: m = 16; s = 4; break;
		// 	case 4: m = 8; s = 3; break;
		// 	case 5: m = 4; s = 2; break;
		// 	case 6: m = 2; s = 1; break;
		// 	case 7: m = 1; s = 0; break;
		// }

		return (target[b] & m) >> s;
	}

	// bitsize = 2
	// bitoffset = 0: v0 = v << 6;				// xy 00 00 00
	// bitoffset = 1: v0 = v << 5;				// 0x y0 00 00
	// bitoffset = 2: v0 = v << 4;				// 00 xy 00 00
	// bitoffset = 3: v0 = v << 3;				// 00 0x y0 00
	// bitoffset = 4: v0 = v << 2;				// 00 00 xy 00
	// bitoffset = 5: v0 = v << 1;				// 00 00 0x y0
	// bitoffset = 6: v0 = v << 0;				// 00 00 00 xy
	// bitoffset = 7: v0 = v >> 1;	v1 = (v % 2) << 7;	// 00 00 00 0x | y0 00 00 00

	// bitsize = 3
	// bitoffset = 0: v0 = v << 5;				// xy z0 00 00
	// bitoffset = 1: v0 = v << 4;				// 0x yz 00 00
	// bitoffset = 2: v0 = v << 3;				// 00 xy z0 00
	// bitoffset = 3: v0 = v << 2;				// 00 0x yz 00
	// bitoffset = 4: v0 = v << 1;				// 00 00 xy z0
	// bitoffset = 5: v0 = v << 0;				// 00 00 0x yz
	// bitoffset = 6: v0 = v >> 1; v1 = (v % 2) << 7;	// 00 00 00 xy | z0 00 00 00
	// bitoffset = 7: v0 = v >> 2; v1 = (v % 4) << 6;	// 00 00 00 0x | yz 00 00 00

	// bitsize = 4
	// bitoffset = 0: v0 = v << 4;				// xy zt 00 00
	// bitoffset = 1: v0 = v << 3;				// 0x yz t0 00
	// bitoffset = 2: v0 = v << 2;				// 00 xy zt 00
	// bitoffset = 3: v0 = v << 1;				// 00 0x yz t0
	// bitoffset = 4: v0 = v << 0;				// 00 00 xy zt
	// bitoffset = 5: v0 = v >> 1; v1 = (v % 2) << 7;	// 00 00 0x yz | t0 00 00 00
	// bitoffset = 6: v0 = v >> 2; v1 = (v % 4) << 6;	// 00 00 00 xy | zt 00 00 00
	// bitoffset = 7: v0 = v >> 3; v1 = (v % 8) << 5;	// 00 00 00 0x | yz t0 00 00

	// bitsize = 5
	// bitoffset = 0: v0 = v << 3;				// xy zt u0 00
	// bitoffset = 1: v0 = v << 2;				// 0x yz tu 00
	// bitoffset = 2: v0 = v << 1;				// 00 xy zt u0
	// bitoffset = 3: v0 = v << 0;				// 00 0x yz tu
	// bitoffset = 4: v0 = v >> 1; v1 = (v % 2) << 7;	// 00 00 xy zt | u0 00 00 00
	// bitoffset = 5: v0 = v >> 2; v1 = (v % 4) << 6;	// 00 00 0x yz | tu 00 00 00
	// bitoffset = 6: v0 = v >> 3; v1 = (v % 8) << 5;	// 00 00 00 xy | zt u0 00 00
	// bitoffset = 7: v0 = v >> 4; v1 = (v % 16) << 4;	// 00 00 00 0x | yz tu 00 00
	
	// ...
	// ..
	// this goes up to bitsize = 9

	// bitsize = 9
	// bitoffset = 0: v0 = v >> 1;	v1 = (v % 2) << 7; 	// ab cd ef gh | i0 00 00 00
	// bitoffset = 1: v0 = v >> 2;	v1 = (v % 4) << 6; 	// 0a bc de fg | hi 00 00 00
	// bitoffset = 2: v0 = v >> 3;	v1 = (v % 8) << 5; 	// 00 ab cd ef | gh i0 00 00
	// bitoffset = 3: v0 = v >> 4;	v1 = (v % 16) << 4;	// 00 0a bc de | fg hi 00 00
	// bitoffset = 4: v0 = v >> 5;	v1 = (v % 32) << 3; 	// 00 00 ab cd | ef gh i0 00
	// bitoffset = 5: v0 = v >> 6;	v1 = (v % 64) << 2;	// 00 00 0a bc | de fg hi 00
	// bitoffset = 6: v0 = v >> 7;	v1 = (v % 128) << 1; 	// 00 00 00 ab | cd ef gh i0
	// bitoffset = 7: v0 = v >> 8;	v1 = (v % 256) << 0;	// 00 00 00 0a | bc de fg hi

	function w2(target, v, o, bs)
	{
		var b = Math.floor(o / 8), i = o % 8;
		var v0 = 0;
		var v1 = 0;

		if (bs + i <= 8)
		{
			v0 = v << (8 - bs - i)
		}
		else
		{
			v0 = v >> (bs + i - 8);
			v1 = (v % Math.pow(2, (bs + i - 8))) << (16 - bs - i);
		}
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
		// bitoffset = 0: v0 = v << 6;				// xy 00 00 00
		// bitoffset = 1: v0 = v << 5;				// 0x y0 00 00
		// bitoffset = 2: v0 = v << 4;				// 00 xy 00 00
		// bitoffset = 3: v0 = v << 3;				// 00 0x y0 00
		// bitoffset = 4: v0 = v << 2;				// 00 00 xy 00
		// bitoffset = 5: v0 = v << 1;				// 00 00 0x y0
		// bitoffset = 6: v0 = v << 0;				// 00 00 00 xy
		// bitoffset = 7: v0 = v >> 1;	v1 = (v % 2) << 7;	// 00 00 00 0x | y0 00 00 00		

		// bitsize = 2 , reader
		// m0 = 192; s0 = 6; 			// (255 >> 6) << 6 | 
		// m0 = 96; s0 = 5;  			// (255 >> 6) << 5 | 
		// m0 = 48; s0 = 4;  			// (255 >> 6) << 4 | 
		// m0 = 24; s0 = 3;  			// (255 >> 6) << 3 | 
		// m0 = 12; s0 = 2;  			// (255 >> 6) << 2 | 
		// m0 = 6; s0 = 1;   			// (255 >> 6) << 1 | 
		// m0 = 3; s0 = 0;   			// (255 >> 6) << 0 | 
		// m0 = 1; s0 = -1; m1 = 128; s1 = 7	// (255 >> 6) >> 1 |  (255 << 7) % 256

		// bitsize = 3, writer
		// bitoffset = 0: v0 = v << 5;				// xy z0 00 00
		// bitoffset = 1: v0 = v << 4;				// 0x yz 00 00
		// bitoffset = 2: v0 = v << 3;				// 00 xy z0 00
		// bitoffset = 3: v0 = v << 2;				// 00 0x yz 00
		// bitoffset = 4: v0 = v << 1;				// 00 00 xy z0
		// bitoffset = 5: v0 = v << 0;				// 00 00 0x yz
		// bitoffset = 6: v0 = v >> 1; v1 = (v % 2) << 7;	// 00 00 00 xy | z0 00 00 00
		// bitoffset = 7: v0 = v >> 2; v1 = (v % 4) << 6;	// 00 00 00 0x | yz 00 00 00

		// bitsize = 3, reader
		// m0 = 224; s0 = 5;			(255 >> 5) << 5
		// m0 = 112; s0 = 4;			(255 >> 5) << 4
		// m0 = 56; s0 = 3;			(255 >> 5) << 3
		// m0 = 28; s0 = 2;			(255 >> 5) << 2
		// m0 = 14; s0 = 1;			(255 >> 5) << 1
		// m0 = 7; s0 = 0;			(255 >> 5) << 0
		// m0 = 3; s0 = -1; m1 = 128; s1 = 7	(255 >> 5) >> 1 | (255 << 7) % 256
		// m0 = 1; s0 = -2; m1 = 192; s1 = 6	(255 >> 5) >> 2 | (255 << 6) % 256 

		// bitsize = 5, writer
		// bitoffset = 0: v0 = v << 3;				// xy zt u0 00
		// bitoffset = 1: v0 = v << 2;				// 0x yz tu 00
		// bitoffset = 2: v0 = v << 1;				// 00 xy zt u0
		// bitoffset = 3: v0 = v << 0;				// 00 0x yz tu
		// bitoffset = 4: v0 = v >> 1; v1 = (v % 2) << 7;	// 00 00 xy zt | u0 00 00 00
		// bitoffset = 5: v0 = v >> 2; v1 = (v % 4) << 6;	// 00 00 0x yz | tu 00 00 00
		// bitoffset = 6: v0 = v >> 3; v1 = (v % 8) << 5;	// 00 00 00 xy | zt u0 00 00
		// bitoffset = 7: v0 = v >> 4; v1 = (v % 16) << 4;	// 00 00 00 0x | yz tu 00 00		
		
		// bitsize = 5, reader
		// m0 = 248; s0 = 3;			(255 >> 3) << 3
		// m0 = 124; s0 = 2;			(255 >> 3) << 2
		// m0 = 62; s0 = 1;			(255 >> 3) << 1
		// m0 = 31; s0 = 0;			(255 >> 3) << 0
		// m0 = 15; s0 = -1; m1 = 128; s1 = 7 	(255 >> 3) >> 1 | (255 << 7) % 256
		// m0 = 7; s0 = -2;  m1 = 192; s1 = 6	(255 >> 3) >> 2 | (255 << 6) % 256
		// m0 = 3; s0 = -3;  m1 = 224; s1 = 5	(255 >> 3) >> 3 | (255 << 5) % 256
		// m0 = 1; s0 = -4;  m1 = 240; s1 = 4	(255 >> 3) >> 4 | (255 << 4) % 256


		// bitsize = 9, writer
		// bitoffset = 0: v0 = v >> 1;	v1 = (v % 2) << 7; 	// ab cd ef gh | i0 00 00 00
		// bitoffset = 1: v0 = v >> 2;	v1 = (v % 4) << 6; 	// 0a bc de fg | hi 00 00 00
		// bitoffset = 2: v0 = v >> 3;	v1 = (v % 8) << 5; 	// 00 ab cd ef | gh i0 00 00
		// bitoffset = 3: v0 = v >> 4;	v1 = (v % 16) << 4;	// 00 0a bc de | fg hi 00 00
		// bitoffset = 4: v0 = v >> 5;	v1 = (v % 32) << 3; 	// 00 00 ab cd | ef gh i0 00
		// bitoffset = 5: v0 = v >> 6;	v1 = (v % 64) << 2;	// 00 00 0a bc | de fg hi 00
		// bitoffset = 6: v0 = v >> 7;	v1 = (v % 128) << 1; 	// 00 00 00 ab | cd ef gh i0
		// bitoffset = 7: v0 = v >> 8;	v1 = (v % 256) << 0;	// 00 00 00 0a | bc de fg hi

		// m0 = 255; s0 = 0; m1 = 128; s1 = 7;		(255 >> 0) << 0 | (255 << 7) % 256	
		// m1 = 127; s0 = -1; m1 = 192; s1 = 6;		(255 >> 0) >> 1 | (255 << 6) % 256
		// m1 = 63; s0 = -2; m1 = 224; s1 = 5;		(255 >> 0) >> 2 | (255 << 5) % 256
		// m1 = 31; s0 = -3; m1 = 240; s1 = 4;		(255 >> 0) >> 3 | (255 << 4) % 256
		// m1 = 15; s0 = -4; m1 = 248; s1 = 3;		(255 >> 0) >> 4 | (255 << 3) % 256
		// m1 = 7; s0 = -5; m1 = 252; s1 = 2;		(255 >> 0) >> 5 | (255 << 2) % 256
		// m1 = 3; s0 = -6; m1 = 254; s1 = 1;		(255 >> 0) >> 6 | (255 << 1) % 256
		// m1 = 1; s0 = -7; m1 = 255; s1 = 0;		(255 >> 0) >> 7 | (255 << 0) % 256

		var v0,v1;
		if (s0 > 0) v0 = (target[b] & m0) >> s0;
		else v0 = (target[b] & m0) << s0;
		
		if (s1 > 0) v1 = (target[b+1] & m1) >> s1;
		else v1 = (target[b+1] & m1) << s1;

		return (v0 << 8) + v1;
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
})(bitpack || (bitpack = {}));

var target = new Uint8Array(4);
// bitpack.write(target, 509, 0, 9);
bitpack.write(target, 7, 3, 0);
bitpack.write(target, 5, 3, 3);
console.log(target);

for (var i=0;i<4;i++)
	visualize(target[i]);

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