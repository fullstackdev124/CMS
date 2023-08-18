#========================================================================== -*-Perl-*-
#
# !!! Accounting Monitor Daemon !!!
#
# DESCRIPTION
#
#   Daemon Accounting Extension
#
# AUTHOR
#   Danilo Santoro <dsantoro@tecnonetspa.it>
#
# COPYRIGHT
#   Copyright (C) 2016 Danilo 'Parantido' Santoro 
#
# REVISION
#   $Id: CDREngine::Accounting.pm
#
#=====================================================================================
package CDREngine::Accounting;

use 5.008008;
use warnings;

use JSON;
use POSIX;
use LWP::UserAgent;

# Includo le librerie locali
use lib qw(..);

# Use personal packages
use CDREngine::Database;

require Exporter;

our @ISA = qw(Exporter);

# Items to export into callers namespace by default. Note: do not export
# names by default without a very good reason. Use EXPORT_OK instead.
# Do not simply export all your public functions/methods/constants.

# This allows declaration use CDREngine::Accounting ':all';
# If you do not need this, moving things directly into @EXPORT or @EXPORT_OK
# will save memory.
our %EXPORT_TAGS = ( 'all' => [ qw(
	
) ] );

our @EXPORT_OK = ( @{ $EXPORT_TAGS{'all'} } );

our @EXPORT = qw(
	
);

our $VERSION = '1.00';

# Variabili globali
#
my $Initialized = 0;

# Local Db Object
my $mmondatabase = undef;

# Store Remote Upload URI to avoid frequent filesystem read
my @upload_uris = undef;
my @replication_uris = undef;

# Debug log file handler
my $debug_fh = undef;

# Main accounting file
my $accfile = undef;

# Create log pathname if does not exists
if(defined $debug_log) {
	if($debug_log =~ /^(.*)\/[^\/]+\.log$/) {
		if (-e $1) {
		} else {
	    	mkdir $1 or die "[ERROR] Error creating log path directory: $1";
		}
	} else {
	    die "[ERROR] Invalid log path name: $debug_log";
	}
}

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
	my $dbobject = shift;

	if($dbobject->isInitialized()) {
		$mmondatabase = $dbobject;

		# Initialize Debug Log File
		my $debug_log = $mmondatabase->getIpcValue('debug_log');
		open ($debug_fh, '>>', $debug_log) if(defined $debug_log);

		# Get Accounting File
		$accfile = $mmondatabase->getIpcValue('acc_source_file');
		
		# Set Module as Initialized
		$Initialized = 1;
	} else {
		printf("[ERROR | CDREngine::Accounting::init] Parent Object not initialized!\n");
		$Initialized = 0;
	}

	return($Initialized);
}

sub doAccounting {
	if($Initialized) {
		my $this = shift;

		# Print out worker is started
		printf("[34mCDREngine is now [0m [5mparsing accounting records[0m[34m!![0m\n");
	
		# Declare Buffer line
		my $line = undef;
	
		# Handle File to Tail
		my $file = File::Tail->new(
			name		=> $accfile,
			adjustafter	=> 0.1,
			interval	=> 0.1,
			maxinterval	=> 0.1,
			reset_tail	=> 1,
			resetafter	=> 1
		) or die("[ERROR | CDREngine] Unable to listen on $accfile\n");
		
		# Pass every line to selector
		my $loglines = 0;
		while(defined($line = $file->read)) {
			# Debug
			# printf("[34m[CDREngine::Debug][0m [5m %s [0m\n", $line);
			&storeAccLine(undef, $line);
		}
	} else {
		printf("[ERROR | CDREngine::Accounting::parse_serverinfo] Object not initialized!\n");
	}
}

sub storeAccLine() {
	if($Initialized) {
		my $this = shift;
		my $line = shift;

		# Skip on null line
		next if(!length($line));
	
		# Tokenize line
		my @acc    = split(/;/, $line);
		my $acclen = scalar @acc;

		my %cdr_record = ();

		# Purge acc fields
		foreach my $i (0 .. $#acc) { 
			if($acc[$i] =~ /.*:\s+ACC:\s+call\s+(.*):\s+(.*)=(.*)/) {
				$cdr_record{$2} = $3;
			} else {
				my @couple = split(/=/, $acc[$i]);
				chomp($couple[0]) if(defined $couple[0]);
				chomp($couple[1]) if(defined $couple[1]);
				$cdr_record{$couple[0]} = $couple[1];
			}
		}

		# Convert Hash to JSON String
		my $json = to_json \%cdr_record;

		# Retrieve url lists from config file
		@upload_uris = $mmondatabase->getJsonConfigKey('upload_uris');
		@replication_uris = $mmondatabase->getJsonConfigKey('replication_uris');

		# Iterate through all upload uri for 
		# first available
		my $hosts = shift(@upload_uris);
		foreach my $host (@$hosts) {
			# Debug
			printf("Sending to upload host: %s\n", $host);
			# Do not iterate through upload uris if correcty
			# CDR record got correctly stored to actual host.
			last if(&upload2WS(undef, $host, $json) gt 0);
		}

		# Backup record to all available
		# replication hosts
		$hosts = shift(@replication_uris);
		foreach my $host (@$hosts) {
			# Debug
			printf("Sending to replication host: %s\n", $host);
			&upload2WS(undef, $host, $json);
		}
		
	} else {
		printf("[ERROR | CDREngine::Accounting::storeAccLine] Object not initialized!\n");
	}
}

sub upload2WS() {
	my $this = shift;
	my $url = shift;
	my $payload = shift;

	my $ua = LWP::UserAgent->new;
	$ua->timeout(5);
	$ua->agent("CDREngine/0.1");

	# Getting log time -- debug
	my $log_time = strftime("%Y-%m-%d %H:%M:%S", localtime);
	print           "$log_time -> [INFO    | CDREngine::Accounting::storeAccLine] Sending content: cdr=$payload to $url\n";
	print $debug_fh "$log_time -> [INFO    | CDREngine::Accounting::storeAccLine] Sending content: cdr=$payload to $url\n" if defined $debug_log;

	my $req = HTTP::Request->new(POST => $url);
	$req->content_type('application/x-www-form-urlencoded');
	$req->content("cdr=" .$payload);

	# Doing request
	my $res = $ua->request($req);

	# Updating log time -- debug
	$log_time = strftime("%Y-%m-%d %H:%M:%S", localtime);

	# Storing code and content
	my $status = $res->code;
	my $content = $res->content;

	if ($res->is_error) {
		# Handle Timeout
    	if ($status == HTTP::Status::HTTP_REQUEST_TIMEOUT) {
			print           "$log_time -> [TIMEOUT | CDREngine::Accounting::storeAccLine] CDR Record timed out for $host: ($status), $content\n";
			print $debug_fh "$log_time -> [TIMEOUT | CDREngine::Accounting::storeAccLine] CDR Record timed out for $host: ($status), $content\n" if defined $debug_log;
        	return -1;
    	} else {
			print           "$log_time -> [ERROR_H | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n";
			print $debug_fh "$log_time -> [ERROR_H | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n" if defined $debug_log;
        	return 0;
		}
	} else {
		if($status =~ /20[0-9]/) {
			print           "$log_time -> [SUCCESS | CDREngine::Accounting::storeAccLine] CDR Record correctly stored: ($status), $content\n";
			print $debug_fh "$log_time -> [SUCCESS | CDREngine::Accounting::storeAccLine] CDR Record correctly stored: ($status), $content\n" if defined $debug_log;
			return 1;
		# TODO - don't know if this can really happens
		# leaving for safety
		} else {
			print           "$log_time -> [ERROR_R | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n";
			print $debug_fh "$log_time -> [ERROR_R | CDREngine::Accounting::storeAccLine] Error pushing accounting record: ($status), $content\n" if defined $debug_log;
			return 0;
		}
	}
}

1;

__END__
# Below is stub documentation for your module. You'd better edit it!

=head1 NAME

CDREngine::Accounting - Perl extension for blah blah blah

=head1 SYNOPSIS

  use CDREngine::Accounting;
  blah blah blah

=head1 DESCRIPTION

Stub documentation for CDREngine::Accounting, created by h2xs. It looks like the
author of the extension was negligent enough to leave the stub
unedited.

Blah blah blah.

=head2 EXPORT

None by default.



=head1 SEE ALSO

Mention other useful documentation such as the documentation of
related modules or operating system documentation (such as man pages
in UNIX), or any relevant external documentation such as RFCs or
standards.

If you have a mailing list set up for your module, mention it here.

If you have a web site set up for your module, mention it here.

=head1 AUTHOR

root, E<lt>root@E<gt>

=head1 COPYRIGHT AND LICENSE

Copyright (C) 2006 by root

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself, either Perl version 5.8.8 or,
at your option, any later version of Perl 5 you may have available.


=cut
