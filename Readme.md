This CLI tool provides the ability to brute force PDF file with 3 strategies.
1. Random `--random` characters -> you have the option to chose `min-length` and `max-length` of the random string
2. Incrementally `--incremental` characters -> you have the option to choose the charset (`--charset`) from which the incremental starts:

   i. `--charset letters` - will increment on `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`

    ii.`--charset digits` - will increment on `0123456789`

    iii.`--charset special` - will increment on `!@#$%^&*()`

    iv.`--charset all` - will increment on all of the above
3. Wordlist `--wordlist` -> you should provide a path to a file with words to try seperated by comma (i.e `mypass,mypass1`)

Add `--debug` flag for debug printing

Usage:
1. Clone this repository `git clone https://github.com/orevron/pdfCracker.git`
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the ts script
4. Run the script:

   i. `node ./build/index.js /path/to/pdfFile.pdf --random`

    ii.  `node ./build/index.js /path/to/pdfFile.pdf --incremental --charset all`

    iii. `node ./build/index.js /path/to/pdfFile.pdf --wordlist /path/to/dict.txt`