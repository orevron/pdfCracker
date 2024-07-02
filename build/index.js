"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const cliProgress = __importStar(require("cli-progress"));
const winston = __importStar(require("winston"));
const process = __importStar(require("process"));
const program = new commander_1.Command();
program
    .argument('<pdf_file>', 'Path to the PDF file')
    .option('--wordlist <wordlist>', 'Path to the wordlist file')
    .option('--incremental', 'Use incremental cracking')
    .option('--random', 'Use random password generation')
    .option('--debug', 'Prints debug printings (trying passwords and outputs)', false)
    .option('--min-length <minLength>', 'Minimum length for random passwords', '4')
    .option('--max-length <maxLength>', 'Maximum length for random passwords', '16')
    .option('--charset <charset>', 'Character set for incremental cracking (letters, digits, special, all)', 'digits');
program.parse(process.argv);
const options = program.opts();
class PDFCrackerCLI {
    constructor(pdfFile) {
        this.passwordFound = false;
        this.logger = winston.createLogger({
            level: options.debug ? 'debug' : 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} ${level}: ${message}`;
            })),
            transports: [new winston.transports.Console()]
        });
        this.pdfFilePath = pdfFile;
    }
    async crackPDFWithWordlist(wordlist) {
        this.logger.info('Cracking with wordlist...');
        const startTime = Date.now();
        const passwords = fs.readFileSync(wordlist, 'utf-8').split('\n').map(line => line.trim());
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        if (!options.debug)
            progressBar.start(passwords.length, 0);
        for (const [index, password] of passwords.entries()) {
            this.logger.debug(`Trying password: ${password}`);
            if (this.passwordFound)
                break;
            if (!options.debug)
                progressBar.update(index);
            try {
                await this.tryPassword(password);
                console.log(` Password found: ${password} (Time taken: ${(Date.now() - startTime) / 1000} seconds)`);
                this.passwordFound = true;
                if (!options.debug)
                    progressBar.stop();
                return;
            }
            catch (err) {
            }
        }
        if (!options.debug)
            progressBar.stop();
    }
    async crackPDFIncremental(charset) {
        this.logger.info(`Cracking incrementally on ${charset}...`);
        const startTime = Date.now();
        const charsetArray = charset.split('');
        for (let length = 1; length <= 8; length++) {
            if (this.passwordFound)
                break;
            const combinations = this.generateCombinations(charsetArray, length);
            for (const password of combinations) {
                this.logger.debug(`Trying password: ${password}`);
                if (this.passwordFound)
                    break;
                try {
                    await this.tryPassword(password);
                    this.logger.info(`Password found: ${password} (Time taken: ${(Date.now() - startTime) / 1000} seconds)`);
                    this.passwordFound = true;
                    return;
                }
                catch (err) {
                }
            }
        }
    }
    async crackPDFRandom(minLength, maxLength) {
        this.logger.info('Cracking randomly...');
        const startTime = Date.now();
        while (!this.passwordFound) {
            const password = this.generateRandomPassword(minLength, maxLength);
            this.logger.debug(`Trying password: ${password}`);
            try {
                await this.tryPassword(password);
                this.logger.info(`Password found: ${password} (Time taken: ${(Date.now() - startTime) / 1000} seconds)`);
                this.passwordFound = true;
                return;
            }
            catch (err) {
            }
        }
    }
    generateCombinations(charset, length) {
        if (length === 1)
            return charset;
        const smallerCombinations = this.generateCombinations(charset, length - 1);
        const combinations = [];
        for (const char of charset) {
            for (const smallerCombination of smallerCombinations) {
                combinations.push(char + smallerCombination);
            }
        }
        return combinations;
    }
    generateRandomPassword(minLength, maxLength) {
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    }
    async tryPassword(password) {
        try {
            return (0, child_process_1.execSync)(`qpdf --password="${password}" --decrypt ${this.pdfFilePath} temp.pdf`, {
                encoding: 'utf8',
                stdio: 'ignore'
            });
        }
        catch (err) {
            this.logger.debug(`Failed password attempt: ${password}`);
            throw err;
        }
    }
}
const pdfFile = program.args[0];
const cracker = new PDFCrackerCLI(pdfFile);
if (options.wordlist) {
    cracker.crackPDFWithWordlist(options.wordlist);
}
else if (options.incremental) {
    let charset = '';
    if (options.charset.includes('digits'))
        charset += '0123456789';
    if (options.charset.includes('letters'))
        charset += 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.charset.includes('special'))
        charset += '!@#$%^&*()';
    if (options.charset.includes('all'))
        charset += '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZs!@#$%^&*()';
    cracker.crackPDFIncremental(charset);
}
else if (options.random) {
    const minLength = parseInt(options.minLength, 10);
    const maxLength = parseInt(options.maxLength, 10);
    cracker.crackPDFRandom(minLength, maxLength);
}
else {
    console.log('No cracking method specified. Use --wordlist, --incremental, or --random.');
}
