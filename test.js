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
	for (var bs=1;bs<26;bs++)
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
					if (counter % 1000000 == 0)
						console.log("-------ok------- " + counter / 1000000);

					// console.log("value written " + v);
					// console.log("bitsize " + bs);
					// console.log("offset " + offset);
					// console.log("value read " + v2);
					// console.log("-------ok-------");
				}
				else
				{
					console.log("failed at " + counter);
					console.log("value written " + v);
					console.log("bitsize " + bs);
					console.log("offset " + offset);
					console.log("value read " + v2);

					visualizeArray(target);
					process.exit();
				}
			}
		}
	}
}