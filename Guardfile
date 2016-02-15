require 'asciidoctor'
require 'erb'

options = {:mkdirs => true, :safe => :unsafe, :attributes => ['linkcss', 'allow-uri-read']}

guard 'shell' do
  watch('README.adoc') {|m|
    Asciidoctor.render_file('README.adoc', options.merge(:to_dir => 'target/generated-docs'))
  }
  watch(/^[A-Z-a-z][^#]*\.adoc$/) {|m|
    Asciidoctor.render_file('README.adoc', options.merge(:to_dir => 'target/generated-docs'))
  }
end
