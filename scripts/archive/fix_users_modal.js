const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'app', 'admin', 'users', 'page.js');
let content = fs.readFileSync(filepath, 'utf8');

// Add import
if (!content.includes('CsvImportModal')) {
  content = content.replace(
    /import \{ useRouter, usePathname, useSearchParams \} from "next\/navigation";/,
    `import { useRouter, usePathname, useSearchParams } from "next/navigation";\nimport CsvImportModal from "@/components/admin/settings/CsvImportModal";`
  );
}

// Extract out everything from {/* Bulk Import Modal */} to the end of the file except the last </div>
const bulkModalRegex = /\{\/\* Bulk Import Modal \*\/\}(.|\n)*?\}\)\}\s*<\/div>\s*\)\s*\}/m;
// Actually, to be safe, I'll just use string manipulation.
const startIdx = content.indexOf('{/* Bulk Import Modal */}');
// find the matching closing tag for isBulkModalOpen && ( ... )
// It's followed by </div> ); }

if (startIdx !== -1) {
  const replacement = `
      {/* Bulk Import Modal */}
      <CsvImportModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onImportSuccess={fetchUsers} 
        endpoint="users/bulk" 
        templateHeaders={['id', 'name', 'role', 'angkatan', 'wilayah', 'password', 'tahun_pembinaan', 'fasil_role']} 
        templateFileName="template_users.csv" 
      />
    </div>
  );
}`;
  
  content = content.substring(0, startIdx) + replacement;
}

fs.writeFileSync(filepath, content);
console.log("Updated users page modal.");
