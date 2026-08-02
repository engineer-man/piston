const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to create runtimes.txt from CLI list
function createRuntimesFile() {
    try {
        console.log('Creating runtimes.txt from available packages...');
        const command = 'node cli/index.js ppman list';
        const output = execSync(command, { encoding: 'utf8' });
        
        // Parse the output and extract runtime information
        const lines = output.split('\n').filter(line => line.trim());
        const runtimes = [];
        
        for (const line of lines) {
            // Remove bullet points and clean the line
            const cleanLine = line.replace(/^[•\s]+/, '').trim();
            if (!cleanLine) continue;
            
            // Split by space to get language and version
            const parts = cleanLine.split(' ');
            if (parts.length >= 2) {
                const language = parts[0];
                const version = parts[1];
                runtimes.push(`${language} ${version}`);
            }
        }
        
        // Write to runtimes.txt
        const runtimesFile = path.join(__dirname, 'runtimes.txt');
        fs.writeFileSync(runtimesFile, runtimes.join('\n') + '\n');
        console.log(`✓ Created runtimes.txt with ${runtimes.length} runtimes`);
        
        return runtimes.length;
    } catch (error) {
        console.error('Error creating runtimes.txt:', error.message);
        return 0;
    }
}

// Function to parse runtimes from file line by line
function parseRuntimesLineByLine(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const runtimes = [];
        for (const line of lines) {
            // Clean up the line and extract runtime info
            const cleanLine = line.replace(/[^\x00-\x7F]/g, '').trim();
            if (!cleanLine) continue;
            
            // Split by space to get language and version
            const parts = cleanLine.split(' ');
            if (parts.length >= 2) {
                const language = parts[0];
                const version = parts[1];
                runtimes.push({ language, version });
            }
        }
        
        return runtimes;
    } catch (error) {
        console.error('Error reading runtimes file:', error.message);
        return [];
    }
}

// Function to install a single runtime
function installRuntime(language, version) {
    try {
        console.log(`Installing ${language} ${version}...`);
        const command = `node cli/index.js ppman install ${language}=${version}`;
        execSync(command, { stdio: 'inherit' });
        console.log(`✓ Successfully installed ${language} ${version}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to install ${language} ${version}:`, error.message);
        return false;
    }
}

// Function to install runtimes line by line
async function installRuntimesLineByLine() {
    const runtimesFile = path.join(__dirname, 'runtimes.txt');
    
    if (!fs.existsSync(runtimesFile)) {
        console.log('runtimes.txt not found. Creating it from available packages...');
        const count = createRuntimesFile();
        if (count === 0) {
            console.error('Failed to create runtimes.txt');
            process.exit(1);
        }
    }
    
    console.log('Reading runtimes from runtimes.txt line by line...');
    const runtimes = parseRuntimesLineByLine(runtimesFile);
    
    if (runtimes.length === 0) {
        console.error('No runtimes found in runtimes.txt');
        process.exit(1);
    }
    
    console.log(`Found ${runtimes.length} runtimes to install`);
    console.log('Starting installation...\n');
    
    let successCount = 0;
    let failureCount = 0;
    let currentIndex = 0;
    
    for (const runtime of runtimes) {
        currentIndex++;
        console.log(`[${currentIndex}/${runtimes.length}] Processing: ${runtime.language} ${runtime.version}`);
        
        const success = installRuntime(runtime.language, runtime.version);
        if (success) {
            successCount++;
        } else {
            failureCount++;
        }
        
        // Add a delay between installations to avoid overwhelming the system
        if (currentIndex < runtimes.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n=== Installation Summary ===');
    console.log(`Successfully installed: ${successCount}`);
    console.log(`Failed installations: ${failureCount}`);
    console.log(`Total runtimes: ${runtimes.length}`);
    
    if (failureCount > 0) {
        console.log('\nSome installations failed. You may want to retry failed ones manually.');
    }
}

// Function to update runtimes.txt with clean format
function updateRuntimesFile() {
    const runtimesFile = path.join(__dirname, 'runtimes.txt');
    const backupFile = path.join(__dirname, 'runtimes.backup.txt');
    
    try {
        // Create backup
        if (fs.existsSync(runtimesFile)) {
            fs.copyFileSync(runtimesFile, backupFile);
            console.log('Created backup: runtimes.backup.txt');
        }
        
        // Read and clean the content
        const content = fs.readFileSync(runtimesFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        // Clean up special characters and format properly
        const cleanLines = lines.map(line => {
            const cleanLine = line.replace(/[^\x00-\x7F]/g, '').trim();
            return cleanLine;
        }).filter(line => line.length > 0);
        
        // Write back clean content
        fs.writeFileSync(runtimesFile, cleanLines.join('\n') + '\n');
        console.log('✓ Cleaned up runtimes.txt file');
        
    } catch (error) {
        console.error('Error updating runtimes file:', error.message);
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--clean')) {
        console.log('Cleaning runtimes.txt file...');
        updateRuntimesFile();
        process.exit(0);
    }
    
    if (args.includes('--create')) {
        console.log('Creating runtimes.txt from available packages...');
        createRuntimesFile();
        process.exit(0);
    }
    
    if (args.includes('--help')) {
        console.log('Usage: node install-runtimes.js [options]');
        console.log('Options:');
        console.log('  --clean    Clean up the runtimes.txt file (remove special characters)');
        console.log('  --create   Create runtimes.txt from available packages');
        console.log('  --help     Show this help message');
        console.log('');
        console.log('If no options provided, will create runtimes.txt if not exists and install all runtimes');
        process.exit(0);
    }
    
    // Default behavior: create runtimes.txt if not exists and install all runtimes
    installRuntimesLineByLine().catch(error => {
        console.error('Error during installation:', error);
        process.exit(1);
    });
}

module.exports = { 
    parseRuntimesLineByLine, 
    installRuntime, 
    installRuntimesLineByLine, 
    updateRuntimesFile,
    createRuntimesFile
}; 