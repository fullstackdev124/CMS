#========================================================================== -*-Perl-*-
#
# !!! MonkeY Voice Monitor Daemon !!!
#
# DESCRIPTION
#
#   MonkeY Voice Monitor Daemon Database Extension
#
# AUTHOR
#   Danilo Santoro <dsantoro@tecnonetspa.it>
#
# COPYRIGHT
#   Copyright (C) 2016 Danilo 'Parantido' Santoro @ Tecnonet S.p.A.
#
# REVISION
#   $Id: CDREngine::Database.pm 2.3 2016-10-03 00:00:00 CET
#
#=====================================================================================
package CDREngine::Database;

# Minima versione di Perl richiesta
use 5.008004;

# Versione del modulo
$VERSION = '0.01';

# Standard requirements
use Carp;
use POSIX;
use DB_File;
use File::stat;
use Config::JSON;
use warnings::register;

# Includo le librerie DBI
use DBI;

# Includo le librerie locali
use lib qw(..);

# Variabile di inizializzazione
my $Initialized = 0;

# Definisce i pathname dei berkley DB
my $basepath = "/tmp";
my $ipcdb    = $basepath. "/.ipcDb";
my $cdrsdb   = $basepath. "/.cdrsDb";

# Definisco gli hash di configurazione
my %ipchash;
my %cdrhash;

# Stored config file
$stored_configfile = undef;

# Inizializzazione
sub new {
	my $pkg = shift;
	my $this = {};
	
	# Importa il nome di classe
	bless ($this, $pkg);
	
	# Ritorna il puntatore a classe
	return $this;
}

sub init {
	my $this = shift;
	
	# Open Temporary Directory
	opendir(TMP, $basepath) or die ("[ERROR | CDREngine] unable to open temporary folder ($basepath)!\n");
	
	# Purge directory from existing BDB files
	while (my $tempdir = readdir(TMP)) {
		# Skip dot e dotdot
		next if ($tempdir =~ m/^\.$/);
		next if ($tempdir =~ m/^\.\.$/);
	
		# Purge Files
		if(
			$tempdir =~ /\..*Db/ 
		) {
			printf("Removing: %s\n", $tempdir);
			unlink("$basepath/$tempdir") or die("[ERROR | CDREngine] unable to remove DBD cache file ($basepath/$tempdir)!\n");
		}
	}
	
	closedir(TMP);
	
	# Initialize DB File For InterProcess Communication
	if(-e $ipcdb) {
		# I exists delete it
		unlink($ipcdb);
	}
	tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");

	# Initialize DB File For CDRs List Indexing
	if(-e $cdrsdb) {
		# I exists delete it
		unlink($cdrsdb);
	}
	tie %cdrhash, 'DB_File', $cdrsdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize CDRs Index Db!");

	# Close Db File
	untie %ipchash;
	untie %cdrhash;

	# Set as initialized
	$Initialized = 1;

	# Ritorna l'esito positivo
	return 1;
}

## Load basic settings from main config file
sub loadConfig() {
	if($Initialized) {
		my $this = shift;
		my $configfile = shift;

		# Store config file reference
		$stored_configfile = $configfile;
		
		# Load Configuration File
		my $cfg = Config::JSON->new(pathToFile => $configfile) or die("c[31mUnable to read config file ($configfile): [0m $!\n");
		
		###################################################################### MAIN BOT CONFIGURATION ##
		#
		# My System Name
		&setIpcValue("null", "botname", "CDREngine");
		# [MySQL Stats Plugin]
		#
		# Define MySQL Server IP/Hostname
		&setIpcValue("null", "mysqlhost", $cfg->get("db/host"));
		# Define MySQL User
		&setIpcValue("null", "mysqluser", $cfg->get("db/user"));
		# Define MySQL Password
		&setIpcValue("null", "mysqlpass", $cfg->get("db/pass"));
		# Define MySQL Accounting Db
		&setIpcValue("null", "mysqlaccountingdb", $cfg->get("db/dbnm"));
		#
		# Retrieve Accounting Source File
		&setIpcValue("null", "acc_source_file", $cfg->get("accounting/source_file"));
		#
		# Define WS endpoint url Acc Db
		&setIpcValue("null", "upload_uris", $cfg->get("upload_uris"));
		&setIpcValue("null", "replication_uris", $cfg->get("replication_uris"));
		# Define Debug Log Pat
		&setIpcValue("null", "debug_log", $cfg->get("system/debug_log"));
		################################################################## END MAIN BOT CONTIGURATION ##

		# Load Settings From Database
		&loadDatabaseConfig(undef);
	} else {
		printf("[ERROR | CDR::Database::loadConfig] Object not initialized!\n");
	}
}

## Load advanced settings from database connector
sub loadDatabaseConfig() {
	if($Initialized) {
		my $this = shift;

	} else {
		printf("[ERROR | CDR::Database::loadDatabaseConfig] Object not initialized!\n");
	}
}

## Config::JSON doesn't seems to works well with 
## JSON array objects
sub getJsonConfigKey {
	my $this = shift;
	
	my $key = shift;
	my @parts = split '/', $key;
	my $lastPart = pop @parts;
	open my $fh, '<', $stored_configfile or die "open($stored_configfile): $!";
	my $raw = do {
		local $/;
		<$fh>;
	};
	close $fh;
	my $data = JSON->new->relaxed(1)->decode($raw);
	my $directive = $data;
	for my $part (@parts) {
		$directive = $directive->{$part};
	}
	return $directive->{$lastPart};
}

sub getIpcValue {
	if($Initialized) {
		my $this = shift;
		my $value = shift;
		
		tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");
			return $ipchash{$value};
		untie %ipchash;
	} else {
		printf("[ERROR | CDR::Database::getIpcValue] Object not initialized!\n");
	}
}

sub deleteIpc() {
	if($Initialized) {
		my $this = shift;
		my $key = shift;
		
		# Open Cache DBD File
		tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");

		delete($ipchash{$key});
	
		if(not exists($ipchash{$key})) {
			untie %ipchash;
			return 1;
		} else {
			untie %ipchash;
			return 0;
		}
	} else {
		printf("[ERROR | CDR::Database::deleteIpc] Object not initialized!\n");
	}
}

sub setIpcValue {
	if ($Initialized) {
		my $this = shift;
		my $key = shift;
		my $value = shift;
		
		tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");

		$ipchash{$key} = $value;
		
		if(exists($ipchash{$key})) {
			if($ipchash{$key} eq $value) {
				untie %ipchash;
				return 1;
			} else {
				untie %ipchash;
				return 0;
			}
		} else {
			return 0;
		}
		
	} else {
		printf("[ERROR | CDR::Database::setIpcValue] Object not initialized!\n");
	}
}

sub ipcValueIncrement {
	if ($Initialized) {
		my $this = shift;
		my $key = shift;
		my $incr = shift;
		
		tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");
		
		my $buf = 0;

		if(exists($ipchash{$key})) {
			$buf = $ipchash{$key};
		}

		$buf = ($buf + $incr);
		$ipchash{$key} = $buf;
	
		if($ipchash{$key} eq $buf) {
			untie %ipchash;
			return 1;
		} else {
			untie %ipchash;
			return 0;
		}
		
	} else {
		printf("[ERROR | CDR::Database::playerValueIncrement] Object not initialized!\n");
	}
}

sub ipcExists {
	if($Initialized) {
		my $this = shift;
		my $value = shift;
		
		tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");
		
		while (my ($key, $kvalue) = each(%ipchash)) {
			if($key eq $value) {
				untie %ipchash;
				return(1);
			}
		}
		
		untie %ipchash;
		return(0);
	} else {
		printf("[ERROR | CDR::Database::ipcExists] Object not initialized!\n");
	}
}

sub getCDRLine {
	if($Initialized) {
		my $this = shift;
		my $key  = shift;
		
		tie %cdrhash, 'DB_File', $cdrsdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize CDR Db!");
			return $cdrhash{$key};
		untie %cdrhash;
	} else {
		printf("[ERROR | CDR::Database::getCDRLine] Object not initialized!\n");
	}
}

sub delCDRLine() {
	if($Initialized) {
		my $this = shift;
		my $key  = shift;
		
		# Open Cache DBD File
		tie %cdrhash, 'DB_File', $cdrsdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize CDR Db!");

		delete($cdrhash{$key});
	
		if(not exists($cdrhash{$key})) {
			untie %cdrhash;
			return 1;
		} else {
			untie %cdrhash;
			return 0;
		}
	} else {
		printf("[ERROR | CDR::Database::deleteIpc] Object not initialized!\n");
	}
}

sub setCDRLine {
	if ($Initialized) {
		my $this  = shift;
		my $key   = shift;
		my $value = shift;
		
		tie %cdrhash, 'DB_File', $cdrsdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize CDR Db!");

		$cdrhash{$key} = $value;

		if(exists($cdrhash{$key})) {
			if($cdrhash{$key} eq $value) {
				untie %cdrhash;
				return 1;
			} else {
				untie %cdrhash;
				return 0;
			}
		} else {
			return 0;
		}
		
	} else {
		printf("[ERROR | CDR::Database::setCDRLine] Object not initialized!\n");
	}
}

sub mysql_connectDatabase() {
	if($Initialized) {
		# Get Database Type: 0=Proxy, 1=Accounting, 2=XMPP
		# TODO: discontinued
		my $dbtype = shift;

		# Open datastructure file hash
		tie %ipchash, 'DB_File', $ipcdb, O_CREAT|O_RDWR, 0640 or die("[ERROR | CDREngine] unable to initialize IPC Db!");

		# Select Database Type
		my $database = $ipchash{'mysqlaccountingdb'};

		# Build Connection String
		my $cs = "DBI:mysql:database=" .$database. ";host=" .$ipchash{'mysqlhost'};	
		
		# Debug
		# printf("CS: %s User: %s Password: %s\n", $cs,  $ipchash{'mysqluser'}, $ipchash{'mysqlpass'});

		# Connect Database
		my $dbh = DBI->connect($cs, $ipchash{'mysqluser'}, $ipchash{'mysqlpass'}, {'RaiseError' => 0})
			or printf("[ERROR | CDR::Database::mysql_connectDatabase] Connect: %s", $DBI::errstr);

		# Close Datastructure file
		untie %ipchash;

		(defined($dbh)) ? return $dbh : return undef; 
	} else {
		printf("[ERROR | CDR::Database::mysql_connectDatabase] Object not initialized!\n");
	}
}

sub mysql_executeQuery() {
	if($Initialized) {
		my $this = shift;
		my $type = shift;
		my $ssql = shift;

		# Skip on empty query
		next if(!defined($ssql) || !length($ssql));

		# Connect Database
		my $dbh = &mysql_connectDatabase($type);
		
		# Return if not defined
		return undef if(not defined($dbh));
		
		# Prepare Query
		my $sth = $dbh->prepare($ssql);

		# Execute Statement
		my $retvalue = 0;
		if($sth->execute()) { $retvalue = 1; }
		
		# End Statement
		$sth->finish;
		$sth = undef;
	
		# Close Database Connection
		$dbh->disconnect;
		$dbh = undef;

		return($retvalue);
	} else {
		printf("[ERROR | CDREngine::Database::mysql_executeQuery] Object not initialized!\n");
	}
}

sub mysql_getSQLResultSet() {
	if($Initialized) {
		my $this = shift;
		my $type = shift;
		my $ssql = shift;

		# Skip on empty query
		next if(!defined($ssql) || !length($ssql));

		# Connect Database
		my $dbh = &mysql_connectDatabase($type);
		
		# Return if not defined
		return undef if(not defined($dbh));
		
		# Prepare Query
		my $sth = $dbh->prepare($ssql);

		# Execute Statement
		my $retvalue = undef;
		if($sth->execute()) { $retvalue = $sth->fetchall_arrayref; }
		
		# End Statement
		$sth->finish;
		$sth = undef;
	
		# Close Database Connection
		$dbh->disconnect;
		$dbh = undef;

		return($retvalue);
	} else {
		printf("[ERROR | CDREngine::Database::mysql_executeQuery] Object not initialized!\n");
	}
}

sub isInitialized {
	my $this = shift;
	return($Initialized);
}

sub quote {
	my $this = shift;
	my $str  = shift;
	$str =~ s/\\/\\\\/sg;
	$str =~ s/\0/\\0/sg;
	$str =~ s/\'/\\\'/sg;
	$str =~ s/\n/\\n/sg;
	$str =~ s/\r/\\r/sg;
	return "'$str'";
}

sub trim() {
	if($Initialized) {
		my $string = shift;
		$string =~ s/^\s+//;
		$string =~ s/\s+$//;
		return $string;
	} else {
		printf("[ERROR | CDR::Database::trim] Object not initialized!\n");
	}
}

sub ltrim($) {
	if($Initialized) {
		my $string = shift;
		$string =~ s/^\s+//g;
		return $string;
	} else {
		printf("[ERROR | CDR::Database::ltrim] Object not initialized!\n");
	}
}

sub rtrim() {
	if($Initialized) {
		my $string = shift;
		$string =~ s/\s+$//g;
		return $string;
	} else {
		printf("[ERROR | CDR::Database::rtrim] Object not initialized!\n");
	}
}

sub stripspaces() {
	if($Initialized) {
		my $string = shift;
		$string =~ s/\t+/ /g;
		$string =~ s/\s+/ /g;
		$string =~ s/\n+//g;
		return $string;
	} else {
		printf("[ERROR | CDR::Database::stripspaces] Object not initialized!\n");
	}
}

sub doPurge() {
	if($Initialized) {
		my $string = shift;
		return(&ltrim(&rtrim(&stripspaces($string))));
	} else {
		printf("[ERROR | CDR::Database::doPurge] Object not initialized!\n");
	}
}

1;

__END__
