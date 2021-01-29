import yaml


with open('piston.yaml') as dbc:
    with open('install_script.sh') as install_script_file:
        with open('build.yaml' , 'w+') as distrobuilder_config_file_new:
            distrobuilder_config = yaml.safe_load(dbc)
            distrobuilder_config['actions'].append({
                'trigger': 'post-packages',
                'action': install_script_file.read(),

            })
            yaml.dump(distrobuilder_config, distrobuilder_config_file_new)
