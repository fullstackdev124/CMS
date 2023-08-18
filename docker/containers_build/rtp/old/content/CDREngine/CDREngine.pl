#!/usr/bin/perl
#========================================================================== -*-Perl-*-
#
# !!! CDR Engine Daemon !!!
#
# DESCRIPTION
#
#   OpenSIPS CDR Engine Daemon
#
# AUTHOR
#   Danilo Santoro <dsantoro@techfusion.it>
#
# COPYRIGHT
#   Copyright (C) 2016 Danilo 'Parantido' Santoro @ Tech Fusion ITc
#
# REVISION
#   $Id: CDREngine.pl 2.3 2016-10-03 00:00:00 CET
#
#=====================================================================================

# use warnings;
use DB_File;
use File::Tail;
use IO::Select;
use File::Basename;

# For sig chld catch
use POSIX ":sys_wait_h";

# Includo le librerie locali
use lib qw(.);
use lib "./CDREngine/";

# Includo i packages custom
use CDREngine::Database;
use CDREngine::Accounting;

# Define CDREngine Core component
my $mmondatabase    = CDREngine::Database;
my $mmonaccounting  = CDREngine::Accounting;

# CDR Buffer
my %cdrbuffer = ();

# REPORT Mode Var
my $reportmode = 0;
my $acclogfile = undef;

# Default DB Config File
my $configfile = "/usr/local/CDREngine/config/cdrengine.conf";

# Create Istance
$mmondatabase->new();

# Initialize It
if(not $mmondatabase->init()) {
	printf("[ERROR | CDREngine] Unable to initialize CDREngine Database!\n");
	exit(1);
}

# Load Configuration File
$mmondatabase->loadConfig($configfile);

# Store configuration file relative path
$mmondatabase->setIpcValue('configfilepath', $configfile);

# Global Exit Status 
$mmondatabase->setIpcValue('exitstatus', 1);

# Define Modules PID Mapper
my %pidmap = (
	'accounting' => 99999,
);

# Handler del SIGHUP
$SIG{HUP} = sub {
	$mmondatabase->setIpcValue('exitstatus', 1);
	&killall("reload");
};

# USER Signal Handler
$SIG{USR1} = sub {
	$mmondatabase->setIpcValue('exitstatus', 0);
	&killall("exit");
};

# Main Program #
################

# Clear Screen
# printf("c");

# CHLD Fork
defined(my $pid = fork()) or die "[ERROR | CDREngine] Unable to Fork Data Parser CHiLD: $!";

# Instantiate DataParser Child
if ($pid eq 0) {
	# Rename CHLD
        $0 = $mmondatabase->getIpcValue('botname') ."-accounting";
	
	# Start Authentication Server
	$mmonaccounting->new();
	$mmonaccounting->init($mmondatabase);
	$mmonaccounting->doAccounting();

	# Return control to main process
	exit 0;
} else {
	# Get Parser Pid
	$pidmap{'accounting'} = $pid;
	
	# Return control to Parent Process
	$0 = $mmondatabase->getIpcValue('botname')."-parent";

	# Waiting for CHLD Die
	my $uid = waitpid(-1, 0);
	
	# Invoke Process Terminator
	if($mmondatabase->getIpcValue('exitstatus')) {
		&killall("reload");
	} else {
		&killall("exit");
	}

	# Then Exits
	exit($mmondatabase->getIpcValue('exitstatus'));
	
	# Check if doing a simple reload
	if(not $mmondatabase->getIpcValue('doquit')) {
		# Just a reload
		$mmondatabase->setIpcValue('doreload', 0);
	}
}

############
# Functions
sub killall {
	my $type = shift;

	kill 9, $pidmap{'accounting'};

	if($type eq "exit") {
		# Then Exit
		$mmondatabase->setIpcValue('exitstatus', 0);
	} else {
		# Then Reload
		$mmondatabase->setIpcValue('exitstatus', 1);
	}

	exit($mmondatabase->getIpcValue('exitstatus'));
}
