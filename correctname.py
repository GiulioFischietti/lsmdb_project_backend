import os

for filename in os.listdir("./images"):
    if(".jpg.jpg" in filename):
        try:
            os.rename("./images/"+filename, "./images/" +
                    filename.split(".jpg.jpg")[0] + ".jpg")
            # print(filename.split(".jpg.jpg")[0] + ".jpg")
        except FileExistsError as e:
            print(filename)