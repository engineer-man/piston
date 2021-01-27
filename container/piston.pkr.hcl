variable "make_threads" {
    type    = number
    default = 8
}

variable "apt_mirror" {
    type    = string
    default = "http://mirror.math.princeton.edu/pub/ubuntu"
}

source "lxc" "piston-bionic" {
    config_file         = "lxc.conf"
    attach_options      = ["--clear-env"]

    # Base of Ubuntu Bionic (amd64)
    template_name       = "download"
    template_parameters = [
        "--dist", "ubuntu",
        "--release", "bionic",
        "--arch", "amd64"
        ]

}

build {
    sources = ["source.lxc.piston-bionic"]
    provisioner "shell" {
        # Make sure /opt/.profile exists
        inline = ["touch /opt/.profile"]
    }

    provisioner "shell" {
        scripts = fileset(".", "steps/*.sh")
        execute_command = "chmod +x {{ .Path }}; . /opt/.profile; {{ .Vars }} bash {{ .Path }}"
        environment_vars = [
            #"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "MAKE_THREADS=${var.make_threads}",
            "APT_MIRROR=${var.apt_mirror}"
            ]
    }
}
